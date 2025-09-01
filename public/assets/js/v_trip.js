// v_trip.js — default 5, auto-tambah; jarak ke indikator dipendekkan & .card-pages mengisi ruang
document.addEventListener("DOMContentLoaded", function () {
  // pakai data dari server (window.PROJECTS), lalu filter hanya yang aktif
  let projects = (window.PROJECTS || []).slice();

  // ==== Helpers tanggal untuk filter aktif (jam tetap dipakai) ====
  function toDateLocal(str) {
    if (!str) return null;
    const d = new Date(str.replace(" ", "T")); // local time
    return isNaN(d.getTime()) ? null : d;
  }
  function isActiveRange(leaveStr, returnStr, now = new Date()) {
    const a = toDateLocal(leaveStr);
    const b = toDateLocal(returnStr);
    if (!a || !b) return false;
    return a <= now && now <= b; // inclusive
  }
  // filter sekarang
  projects = projects.filter((p) => isActiveRange(p.leaveDate, p.returnDate));

  // ===== Konstanta =====
  const SLIDE_INTERVAL = 10000;

  const HEIGHT_RULE_MIN = 1400;
  const INDICATOR_GAP   = 6;     // ↓ lebih rapat
  const SAFE_MARGIN_PX  = 6;

  // fallback ukuran (selaras CSS sekarang)
  const FALLBACK_CARD_H  = 86;
  const FALLBACK_ROW_GAP = 8;

  const BASE_DESKTOP    = 5;     // default/min desktop
  const BASE_FULLSCREEN = 5;

  // ↓ ruang indikator diperkecil supaya wrapper bisa turun mendekati indikator
  const INDICATOR_RESERVED_PX = 28;

  const playPauseButton         = document.getElementById("playPauseBtn");
  const menuButton              = document.getElementById("menuToggle");
  const menuDropdown            = document.getElementById("horizontalMenu");
  const contentWrapper          = document.querySelector(".content-wrapper");
  const cardPagesContainer      = document.getElementById("cardPages");
  const pageIndicatorsContainer = document.getElementById("pageIndicators");
  const leftArrow               = document.getElementById("leftArrow");
  const rightArrow              = document.getElementById("rightArrow");

  let currentPage = 0;
  let totalPages  = 1;
  let autoSlideInterval = null;
  let isAutoSliding     = true;

  let lastUsedCPP = 0;
  let secondPassScheduled = false;

  const isDesktopWidth     = () => window.innerWidth >= 1400;
  const isAutoSlideAllowed = () => window.innerWidth >= 1400;
  const isTrueFullscreen   = () =>
    !!(document.fullscreenElement || document.webkitFullscreenElement ||
       document.mozFullScreenElement || document.msFullscreenElement);

  // ===== Measurement helpers =====
  function measureUnit() {
    const pageEl = cardPagesContainer.querySelector(".page");
    const cardEl = cardPagesContainer.querySelector(".page .card");
    let cardH  = FALLBACK_CARD_H;
    let rowGap = FALLBACK_ROW_GAP;
    if (cardEl) {
      const r = cardEl.getBoundingClientRect();
      if (Number.isFinite(r.height) && r.height > 0) cardH = r.height;
    }
    if (pageEl) {
      const cs = getComputedStyle(pageEl);
      const g  = parseFloat(cs.rowGap);
      if (Number.isFinite(g) && g >= 0) rowGap = g;
    }
    return { cardH, rowGap };
  }

  function measurePagePaddingTB() {
    const pageEl = cardPagesContainer.querySelector(".page");
    if (!pageEl) return 12; // 6 + 6 (CSS)
    const cs = getComputedStyle(pageEl);
    return (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  }

  // tinggi area yang bisa dipakai .card-pages di dalam wrapper
  function getAvailableHeightPx() {
    if (!contentWrapper || !isDesktopWidth()) return 0;
    const cwRect = contentWrapper.getBoundingClientRect();
    const viewportBottom = window.innerHeight;
    let target = Math.floor(
      viewportBottom - (INDICATOR_RESERVED_PX + INDICATOR_GAP) - cwRect.top
    );
    if (!Number.isFinite(target) || target <= 0) return 0;
    const cs = getComputedStyle(contentWrapper);
    const paddings = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const borders  = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
    return Math.max(0, target - paddings - borders);
  }

  // hitung n kartu (min 5, bisa nambah kalau muat)
  function getCardsPerPageDynamic() {
    if (!isDesktopWidth()) return projects.length || 1;
    const baseline = isTrueFullscreen() ? BASE_FULLSCREEN : BASE_DESKTOP;
    const avail = getAvailableHeightPx();
    if (!avail) return baseline;

    const { cardH, rowGap } = measureUnit();
    const padTB = measurePagePaddingTB();
    const inner = Math.max(0, avail - padTB);

    let n = Math.floor((inner + rowGap - SAFE_MARGIN_PX) / (cardH + rowGap));
    n = Math.max(baseline, n);

    while (n > baseline) {
      const need = n * cardH + (n - 1) * rowGap;
      if (need <= inner - SAFE_MARGIN_PX + 0.5) break;
      n--;
    }
    return n;
  }

  function idealHeightForNCards(n) {
    const { cardH, rowGap } = measureUnit();
    const padTB = measurePagePaddingTB();
    return n * cardH + (n - 1) * rowGap + padTB;
  }

  function capContentWrapperByIndicators() {
    if (!contentWrapper || !pageIndicatorsContainer) return;
    const applyRule = window.innerWidth >= HEIGHT_RULE_MIN;
    if (!applyRule) { contentWrapper.style.maxHeight = ""; contentWrapper.style.overflow = ""; return; }

    const cwRect = contentWrapper.getBoundingClientRect();
    const target = Math.floor(
      window.innerHeight - (INDICATOR_RESERVED_PX + INDICATOR_GAP) - cwRect.top
    );
    if (!Number.isFinite(target) || target <= 0) {
      contentWrapper.style.maxHeight = "";
      contentWrapper.style.overflow  = "";
      return;
    }
    contentWrapper.style.maxHeight = target + "px";
    contentWrapper.style.overflow  = "hidden";
  }

  // .card-pages mengisi ruang sampai mendekati indikator (tetap tidak memotong kartu)
  function applyContainerHeight() {
    if (!isDesktopWidth()) { cardPagesContainer.style.height = ""; return; }

    const cpp        = getCardsPerPageDynamic();
    const idealH     = Math.ceil(idealHeightForNCards(cpp));
    const availInner = getAvailableHeightPx(); // tinggi maksimal yang boleh dipakai

    // Pilih tinggi yang mengisi ruang, tapi tidak melebihi available
    let h = idealH;
    if (availInner && availInner > idealH) h = availInner - 2; // margin kecil

    cardPagesContainer.style.height = h + "px";
    requestAnimationFrame(capContentWrapperByIndicators);
  }

  function applyFullscreenStyling() {
    if (!pageIndicatorsContainer) return;
    if (isTrueFullscreen()) {
      pageIndicatorsContainer.style.bottom = "14px";  // ↓ lebih dekat ke bawah
      if (contentWrapper) contentWrapper.style.paddingTop = "10px";
    } else {
      pageIndicatorsContainer.style.bottom = "10px";  // ↓ lebih dekat ke bawah
      if (contentWrapper) contentWrapper.style.paddingTop = "8px";
    }
    requestAnimationFrame(capContentWrapperByIndicators);
  }

  // ===== Auto slide =====
  function updatePlayPauseIcon() {
    if (playPauseButton) playPauseButton.textContent = isAutoSliding ? "⏸" : "▶";
  }
  function startAutoSlide() {
    if (!isAutoSlideAllowed()) return;
    stopAutoSlide();
    if (!isAutoSliding) return;
    autoSlideInterval = setInterval(() => {
      if (currentPage < totalPages - 1) showPage(currentPage + 1);
      else if (typeof window.goToNextNav === "function") window.goToNextNav();
      else showPage(0);
    }, SLIDE_INTERVAL);
  }
  function stopAutoSlide() { if (autoSlideInterval) { clearInterval(autoSlideInterval); autoSlideInterval = null; } }
  window.stopAutoSlide = stopAutoSlide;
  function toggleAutoSlide() {
    if (!isAutoSlideAllowed()) return;
    isAutoSliding = !isAutoSliding; updatePlayPauseIcon();
    if (isAutoSliding) startAutoSlide(); else stopAutoSlide();
  }

  // ===== Card template (tanpa perubahan struktur) =====
  function createCardHTML(project) {
    const w = window.innerWidth;
    const isTablet = w <= 1399 && w >= 769;

    if (isTablet) {
      return `
        <div class="card-container">
          <div class="card">
            <div class="card-left">
              <div class="plate">${project.plate ?? ""}</div>
              <div class="name">${project.name ?? ""}</div>
            </div>
            <div class="card-middle">
              <div class="location">${project.location ?? ""}</div>
            </div>
            <div class="card-right">
              <div class="request">
                <div class="request-label">Request By</div>
                <div class="request-value">${project.requestBy ?? ""}</div>
              </div>
              <div class="dates">
                <div class="date-group-from">
                  <div class="date-title-from">From</div>
                  <div class="date-value leave">${project.leaveDate ?? ""}</div>
                </div>
                <div class="date-group-return">
                  <div class="date-title-return">Return</div>
                  <div class="date-value return">${project.returnDate ?? ""}</div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    }

    return `
      <div class="card-container">
        <div class="card">
          <div class="card-left">
            <div class="plate">${project.plate ?? ""}</div>
            <div class="name">${project.name ?? ""}</div>
          </div>
          <div class="card-middle">
            <div class="location">${project.location ?? ""}</div>
            <div class="request">
              <div class="request-label">Request By</div>
              <div class="request-value">${project.requestBy ?? ""}</div>
            </div>
          </div>
          <div class="card-right">
            <div class="dates">
              <div class="date-group-from">
                <div class="date-title-from">From</div>
                <div class="date-value leave">${project.leaveDate ?? ""}</div>
              </div>
              <div class="date-group-return">
                <div class="date-title-return">Return</div>
                <div class="date-value return">${project.returnDate ?? ""}</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ===== Render & paging =====
  function generatePages() {
    const pages = [];
    lastUsedCPP = getCardsPerPageDynamic();
    const CARDS_PER_PAGE = lastUsedCPP;

    for (let i = 0; i < projects.length; i += CARDS_PER_PAGE) {
      pages.push(projects.slice(i, i + CARDS_PER_PAGE));
    }
    return pages.length ? pages : [[]];
  }

  function renderPages() {
    const pages = generatePages();
    totalPages = pages.length;
    cardPagesContainer.innerHTML = "";
    pageIndicatorsContainer.innerHTML = "";

    pages.forEach((pageData) => {
      const pageDiv = document.createElement("div");
      pageDiv.className = "page";
      pageData.forEach((project) => { pageDiv.innerHTML += createCardHTML(project); });
      cardPagesContainer.appendChild(pageDiv);
    });

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement("div");
      dot.className = "indicator-dot";
      if (i === 0) dot.classList.add("active");
      dot.dataset.page = i;
      pageIndicatorsContainer.appendChild(dot);
    }

    bindIndicatorEvents();
    applyContainerHeight();
    applyFullscreenStyling();
    requestAnimationFrame(capContentWrapperByIndicators);

    // Second pass
    if (!secondPassScheduled) {
      secondPassScheduled = true;
      requestAnimationFrame(() => {
        const cpp2 = getCardsPerPageDynamic();
        secondPassScheduled = false;
        if (cpp2 !== lastUsedCPP) {
          const prev = Math.min(currentPage, totalPages - 1);
          renderPages();
          showPage(prev);
        }
      });
    }
  }

  function bindIndicatorEvents() {
    document.querySelectorAll(".indicator-dot").forEach((dot, index) => {
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        stopAutoSlide();
        showPage(index);
        if (isAutoSliding) startAutoSlide();
      });
    });
  }

  function showPage(index) {
    if (index >= 0 && index < totalPages) {
      currentPage = index;
      const offset = -index * 100;
      cardPagesContainer.style.transform = `translateX(${offset}%)`;
      updateIndicators();
      requestAnimationFrame(capContentWrapperByIndicators);
    }
  }

  function updateIndicators() {
    document.querySelectorAll(".indicator-dot").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentPage);
    });
  }

  function applyResponsiveBehavior() {
    if (!isAutoSlideAllowed()) {
      isAutoSliding = false; updatePlayPauseIcon(); stopAutoSlide();
    } else {
      if (isAutoSliding) startAutoSlide();
    }
    requestAnimationFrame(capContentWrapperByIndicators);
  }

  // ===== Controls =====
  playPauseButton?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!isAutoSlideAllowed()) return;
    toggleAutoSlide();
  });

  document.addEventListener("click", function (e) {
    const insideMenu =
      (menuButton && menuButton.contains(e.target)) ||
      (menuDropdown && menuDropdown.contains(e.target)) ||
      document.getElementById("submenu")?.contains(e.target);
    if (!insideMenu && isAutoSlideAllowed()) toggleAutoSlide();
  });

  leftArrow?.addEventListener("click", (e) => {
    e.stopPropagation();
    stopAutoSlide();
    if (currentPage > 0) {
      showPage(currentPage - 1);
    } else {
      if (typeof window.goToPrevNav === "function") window.goToPrevNav();
      else showPage(totalPages - 1);
    }
    if (isAutoSliding && isAutoSlideAllowed()) startAutoSlide();
  });

  rightArrow?.addEventListener("click", function (e) {
    e.stopPropagation();
    stopAutoSlide();
    if (currentPage < totalPages - 1) showPage(currentPage + 1);
    else if (typeof window.goToNextNav === "function") window.goToNextNav();
    else showPage(0);
    if (isAutoSliding && window.innerWidth >= 1400) startAutoSlide();
  });

  // ===== Init & Reflow =====
  renderPages();
  showPage(0);
  isAutoSliding = isAutoSlideAllowed();
  updatePlayPauseIcon();
  if (isAutoSliding) startAutoSlide();
  applyResponsiveBehavior();

  function reflow() {
    const prev = Math.min(currentPage, totalPages - 1);
    renderPages();
    showPage(prev);
    applyContainerHeight();
    applyResponsiveBehavior();
    applyFullscreenStyling();
    requestAnimationFrame(capContentWrapperByIndicators);
  }

  let resizeT;
  const debouncedReflow = () => { clearTimeout(resizeT); resizeT = setTimeout(reflow, 80); };
  window.addEventListener("resize", debouncedReflow);
  window.addEventListener("orientationchange", debouncedReflow);
  document.addEventListener("fullscreenchange", reflow);
  document.addEventListener("webkitfullscreenchange", reflow);
  document.addEventListener("mozfullscreenchange", reflow);
  document.addEventListener("MSFullscreenChange", reflow);

  window.addEventListener("load", () => { reflow(); setTimeout(reflow, 60); });
});
