// v_trip.js — default 5, auto-tambah; jarak ke indikator dipendekkan & .card-pages mengisi ruang
document.addEventListener("DOMContentLoaded", function () {
  // ===== Data loader (baru) =====
  let projects = []; // ganti dari const → let karena bisa di-update setelah fetch opsional

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // format tanggal: "dd Mon YYYY HH:mm" (jam:menit tetap ditampilkan)
  function formatDateWithTime(sql) {
    if (!sql) return "";
    const safe = String(sql).replace(" ", "T");
    const d = new Date(safe);
    if (isNaN(d)) return String(sql);
    const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // samakan bentuk objek yang dipakai kartu: {plate, name, location, requestBy, leaveDate, returnDate}
  function normalizeRows(rows) {
    return (rows || []).map((r) => {
      const name      = r.name ?? r.people_name ?? r.personel ?? "";
      const location  = r.location ?? r.destination_name ?? r.destination ?? "";
      const requestBy = r.requestBy ?? r.request_by ?? "";
      // plate: pakai langsung kalau sudah ada; kalau belum, susun dari numberPlate & vehicle_name
      let plate = r.plate ?? "";
      if (!plate) {
        const numberPlate = r.numberPlate ?? r.number_plate ?? "";
        const vehicleName = r.vehicle_name ?? r.vehicle ?? "";
        const parts = [];
        if (numberPlate) parts.push(numberPlate);
        if (vehicleName) parts.push(vehicleName);
        plate = parts.join(" - ");
      }
      const leave = r.leaveDate ?? r.leaving_date ?? r.leave ?? "";
      const back  = r.returnDate ?? r.return_date ?? r.return ?? "";

      return {
        plate:      escapeHtml(plate),
        name:       escapeHtml(name),
        location:   escapeHtml(location),
        requestBy:  escapeHtml(requestBy),
        leaveDate:  escapeHtml(formatDateWithTime(leave)),
        returnDate: escapeHtml(formatDateWithTime(back)),
      };
    });
  }

  // 1) render awal pakai data dari controller
  projects = normalizeRows(Array.isArray(window.PROJECTS) ? window.PROJECTS : []);

  // 2) opsional: coba refresh dari endpoint JSON, lalu re-render bila jumlah data berbeda
  (function refreshFromAPI() {
    const candidates = ["/vtrip/list", "/vtrip/json", "/api/vtrip", "/vtrip/data"];
    (async () => {
      for (const url of candidates) {
        try {
          const r = await fetch(url, { headers: { Accept: "application/json" } });
          if (!r.ok) continue;
          const body = await r.json();
          const rows = Array.isArray(body) ? body
                    : Array.isArray(body?.data) ? body.data
                    : Array.isArray(body?.vtrip) ? body.vtrip
                    : Array.isArray(body?.rows) ? body.rows
                    : null;
          if (!rows) continue;

          const fresh = normalizeRows(rows);
          if (fresh.length !== projects.length) {
            projects = fresh;
            // minimal re-render agar tampilan tetap sama
            renderPages();
            showPage(0);
            applyContainerHeight();
            applyResponsiveBehavior();
            requestAnimationFrame(capContentWrapperByIndicators);
          }
          break; // berhenti di endpoint pertama yang valid
        } catch (_) { /* lanjut kandidat berikutnya */ }
      }
    })();
  })();

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
                <div class="request-label">Used By</div>
                <div class="request-value">${project.plate ?? ""}</div>
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
            <div class="name">${project.plate?? ""}</div>
          </div>
          <div class="card-middle">
            <div class="location">${project.location ?? ""}</div>
            <div class="request">
              <div class="request-label">Used By</div>
              <div class="request-value">${project.name ?? ""}</div>
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
