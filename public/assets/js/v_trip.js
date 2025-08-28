document.addEventListener("DOMContentLoaded", function () {
  const projects = (window.PROJECTS || []).slice();
  const SLIDE_INTERVAL = 10000;

  // === Konstanta pembatas tinggi (mengikuti m_loc)
  const HEIGHT_RULE_MIN = 1400;  // mulai terapkan pembatas tinggi
  const INDICATOR_GAP   = 10;    // jarak dari indikator ke bawah wrapper

  // === Ukuran kartu & gap (sinkron dengan CSS desktop .card height & .page gap)
  const CARD_HEIGHT_PX = 105;
  const ROW_GAP_PX = 15;         // .page { gap: 15px; }
  const BASE_DESKTOP = 4;        // baseline normal desktop
  const BASE_FULLSCREEN = 5;     // baseline saat F11 fullscreen

  // Elemen kontrol
  const playPauseButton = document.getElementById("playPauseBtn");
  const menuButton = document.getElementById("menuToggle");
  const menuDropdown = document.getElementById("horizontalMenu");

  // State
  let currentPage = 0;
  let totalPages = 1;
  let autoSlideInterval = null;
  let isAutoSliding = true;

  const contentWrapper = document.querySelector(".content-wrapper");
  const cardPagesContainer = document.getElementById("cardPages");
  const pageIndicatorsContainer = document.getElementById("pageIndicators");
  const leftArrow = document.getElementById("leftArrow");
  const rightArrow = document.getElementById("rightArrow");

  // ===== Helpers
  // (A) Layout desktop murni dari lebar layar nyata (tanpa force)
  const isDesktopWidth = () => window.innerWidth >= 1400;

  // (B) IZIN autoslide (harus mengikuti lebar layar nyata)
  const isAutoSlideAllowed = () => window.innerWidth >= 1400;

  // (C) Fullscreen "beneran" (F11 / Fullscreen API)
  function isTrueFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  // --- page height dasar (sebelum “cap” oleh indikator)
  function getMaxPageHeight() {
    let maxH = 0;
    const pages = cardPagesContainer.querySelectorAll(".page");
    pages.forEach((p) => { maxH = Math.max(maxH, p.scrollHeight); });
    return maxH;
  }

  function applyContainerHeight() {
    if (!isDesktopWidth()) {
      cardPagesContainer.style.height = "";
      return;
    }
    const cpp = getCardsPerPageDynamic(); // ← gunakan dinamis
    if (cpp >= 5 && isTrueFullscreen()) {
      // fullscreen: biarkan tinggi menyesuaikan konten (agar 5+ kartu muat)
      requestAnimationFrame(() => {
        const h = getMaxPageHeight();
        cardPagesContainer.style.height = (h ? (h + 12) : 660) + "px";
        requestAnimationFrame(capContentWrapperByIndicators);
      });
    } else {
      // non-FS: set default, lalu akan "di-cap" oleh indikator
      cardPagesContainer.style.height = "500px";
      requestAnimationFrame(capContentWrapperByIndicators);
    }
  }

  // === NEW: hitung tinggi inner yang tersedia di dalam .content-wrapper (setara logika cap)
  function getAvailableHeightPx() {
    if (!contentWrapper || !pageIndicatorsContainer || !isDesktopWidth()) return 0;

    const applyRule = (window.innerWidth >= HEIGHT_RULE_MIN);
    // walaupun applyRule false, di desktop kita tetap ingin perkirakan tinggi
    const indRect = pageIndicatorsContainer.getBoundingClientRect();
    const cwRect  = contentWrapper.getBoundingClientRect();

    let target = Math.floor(indRect.top - INDICATOR_GAP - cwRect.top);
    if (!Number.isFinite(target) || target <= 0) return 0;

    const cs = getComputedStyle(contentWrapper);
    const paddings = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const borders  = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
    const innerH = Math.max(0, target - paddings - borders); // tinggi untuk .card-pages

    return innerH || 0;
  }

  // === NEW: hitung jumlah kartu per halaman secara dinamis berdasar sisa tinggi
  function getCardsPerPageDynamic() {
    if (!isDesktopWidth()) {
      // di tablet/mobile, kita jadikan satu halaman panjang (pagination tidak dipakai)
      return projects.length || 1;
    }

    const baseline = isTrueFullscreen() ? BASE_FULLSCREEN : BASE_DESKTOP;
    const avail = getAvailableHeightPx();

    if (!avail) return baseline; // fallback aman

    // tinggi baseline (mis. 4 kartu) = n*card + (n-1)*gap
    const baselineHeight = (baseline * CARD_HEIGHT_PX) + ((baseline - 1) * ROW_GAP_PX);
    const perCard = CARD_HEIGHT_PX + ROW_GAP_PX;

    // jika sisa >= 120px → tambah 1 kartu; >=240px → tambah 2 kartu; dst.
    const extra = Math.max(0, Math.floor((avail - baselineHeight) / perCard));
    const result = baseline + extra;

    return Math.max(baseline, result);
  }

  // === Batasi tinggi .content-wrapper agar berhenti 10–30px di atas page indicators
  function capContentWrapperByIndicators() {
    if (!contentWrapper || !pageIndicatorsContainer) return;

    const applyRule = (window.innerWidth >= HEIGHT_RULE_MIN);
    if (!applyRule) {
      contentWrapper.style.maxHeight = "";
      return;
    }

    const indRect = pageIndicatorsContainer.getBoundingClientRect();
    const cwRect  = contentWrapper.getBoundingClientRect();

    let target = Math.floor(indRect.top - INDICATOR_GAP - cwRect.top);
    if (!Number.isFinite(target) || target <= 0) {
      contentWrapper.style.maxHeight = "";
      return;
    }

    contentWrapper.style.maxHeight = target + "px";
    contentWrapper.style.overflow = "hidden";

    const cs = getComputedStyle(contentWrapper);
    const paddings = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const borders  = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
    const innerH = Math.max(0, target - paddings - borders);

    cardPagesContainer.style.height = innerH + "px";
  }

  function applyFullscreenStyling() {
    if (!pageIndicatorsContainer) return;

    if (isTrueFullscreen()) {
      pageIndicatorsContainer.style.bottom = "30px";
      if (contentWrapper) contentWrapper.style.paddingTop = "20px";
    } else {
      pageIndicatorsContainer.style.bottom = "20px";
      if (contentWrapper) contentWrapper.style.paddingTop = "12px";
    }

    // Setelah posisi indikator berubah, hitung ulang cap
    requestAnimationFrame(capContentWrapperByIndicators);
  }

  // ===== UI / Auto-slide
  function updatePlayPauseIcon() {
    if (!playPauseButton) return;
    playPauseButton.textContent = isAutoSliding ? "⏸" : "▶";
  }

  function startAutoSlide() {
    if (!isAutoSlideAllowed()) return;
    stopAutoSlide();
    if (!isAutoSliding) return;
    autoSlideInterval = setInterval(() => {
      if (currentPage < totalPages - 1) {
        showPage(currentPage + 1);
      } else {
        if (typeof window.goToNextNav === "function") {
          window.goToNextNav();
        } else {
          showPage(0);
        }
      }
    }, SLIDE_INTERVAL);
  }

  function stopAutoSlide() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
  }
  window.stopAutoSlide = stopAutoSlide;

  function toggleAutoSlide() {
    if (!isAutoSlideAllowed()) return;
    isAutoSliding = !isAutoSliding;
    updatePlayPauseIcon();
    if (isAutoSliding) startAutoSlide();
    else stopAutoSlide();
  }

  // ===== Card templating
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

    // Desktop biasa & mobile (struktur default)
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

  // ===== Paging
  function generatePages() {
    const pages = [];
    const CARDS_PER_PAGE = getCardsPerPageDynamic(); // ← dinamis berdasarkan sisa tinggi
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
      pageData.forEach((project) => {
        pageDiv.innerHTML += createCardHTML(project);
      });
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
    applyContainerHeight();              // set tinggi awal (500px / dinamis)
    applyFullscreenStyling();            // ini juga akan memanggil cap via rAF
    requestAnimationFrame(capContentWrapperByIndicators); // jaga-jaga
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
      // Tinggi konten bisa berubah antar-halaman → cap ulang
      requestAnimationFrame(capContentWrapperByIndicators);
    }
  }

  function updateIndicators() {
    document.querySelectorAll(".indicator-dot").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentPage);
    });
  }

  // === Auto-pause rule untuk V-Trip: pause saat screen ≤ 1399px
  function applyResponsiveBehavior() {
    if (!isAutoSlideAllowed()) {
      isAutoSliding = false;
      updatePlayPauseIcon();
      stopAutoSlide();
    } else {
      if (isAutoSliding) startAutoSlide();
    }
    requestAnimationFrame(capContentWrapperByIndicators);
  }

  // ===== Controls
  playPauseButton?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!isAutoSlideAllowed()) return;
    toggleAutoSlide();
  });

  // Toggle autoslide di desktop saat klik area kosong (bukan menu)
  document.addEventListener("click", function (e) {
    const insideMenu =
      (menuButton && menuButton.contains(e.target)) ||
      (menuDropdown && menuDropdown.contains(e.target)) ||
      document.getElementById("submenu")?.contains(e.target);
    if (!insideMenu && isAutoSlideAllowed()) {
      toggleAutoSlide();
    }
  });

  leftArrow?.addEventListener("click", function (e) {
    e.stopPropagation();
    stopAutoSlide();
    if (currentPage > 0) {
      showPage(currentPage - 1);
    } else {
      if (typeof window.goToNextNav === "function") window.goToNextNav();
      else showPage(0);
    }
    if (isAutoSliding && window.innerWidth >= 1400) startAutoSlide();
  });

  rightArrow?.addEventListener("click", function (e) {
    e.stopPropagation();
    stopAutoSlide();
    if (currentPage < totalPages - 1) {
      showPage(currentPage + 1);
    } else {
      if (typeof window.goToNextNav === "function") window.goToNextNav();
      else showPage(0);
    }
    if (isAutoSliding && window.innerWidth >= 1400) startAutoSlide();
  });

  // ===== Init
  renderPages();
  showPage(0);

  isAutoSliding = isAutoSlideAllowed();
  updatePlayPauseIcon();
  if (isAutoSliding) startAutoSlide();
  applyResponsiveBehavior();

  // Reflow saat ukuran/FS berubah
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
});
