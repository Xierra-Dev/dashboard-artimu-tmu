document.addEventListener("DOMContentLoaded", () => {
  // ==== Data ====
  const projects = (window.PROJECTS || []).slice();

  // ==== Breakpoints ====
  const BP = {
    DESKTOP_MIN: 1400,  // >=1400 => carousel
    TABLET_MIN: 769,    // 769-1399 => single scroll
    MOBILE_STD_MIN: 480 // 480-768  => single scroll
  };

  // ===== Desktop layout (default 10 kartu: 5 kolom × 2 baris) =====
  const DESK_COLS     = 5;
  const DESK_CARD_W   = 220;
  const DESK_CARD_H   = 210;
  const DESK_COL_GAP  = 12;  // gap horizontal (X)
  const DESK_ROW_GAP  = 28;  // gap vertikal   (Y)

  // ===== Jarak wrapper ke indikator (lebih dekat) =====
  const INDICATOR_GAP_PX = 12;   // sebelumnya 30

  const SLIDE_INTERVAL = 10000;

  // Elemen
  const playPauseButton = document.getElementById("playPauseBtn");
  const cardPagesContainer = document.getElementById("cardPages");
  const pageIndicatorsContainer = document.getElementById("pageIndicators");
  const leftArrow = document.getElementById("leftArrow");
  const rightArrow = document.getElementById("rightArrow");

  // State
  let currentPage = 0;
  let autoSlideInterval = null;
  let isAutoSliding = true;
  let totalPages = 1;
  let isDesktopMode = false;

  const clampProgress = (val) => {
    const n = Number(val);
    if (!isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  };

  function mixedColor(pct) {
    const t = clampProgress(pct) / 100;
    const red = { r: 220, g: 53,  b: 69 };
    const grn = { r: 40,  g: 167, b: 69 };
    const lerp = (a, b, t) => Math.round(a + (b - a) * t);
    return `rgb(${lerp(red.r, grn.r, t)}, ${lerp(red.g, grn.g, t)}, ${lerp(red.b, grn.b, t)})`;
  }

  const getModeIsDesktop = () => window.innerWidth >= BP.DESKTOP_MIN;

  function getPageWidth() {
    const first = cardPagesContainer.querySelector(".page-promag");
    return first ? first.getBoundingClientRect().width : 1148; // 5*220 + 4*12
  }

  // Sinkron tinggi wrapper agar sedikit di atas indikator
  function syncContentWrapperHeight() {
    const wrap = document.querySelector(".content-wrapper-promag");
    const indicators = document.querySelector(".page-indicators-promag");
    if (!wrap || !indicators) return 0;

    if (!isDesktopMode) {
      wrap.style.removeProperty("--content-h");
      return wrap.getBoundingClientRect().height || 0;
    }

    // Bebaskan dulu untuk ukur natural
    wrap.style.removeProperty("--content-h");

    const wrapRect = wrap.getBoundingClientRect();
    const indRect  = indicators.getBoundingClientRect();

    // target height = top(indicators) - GAP - top(wrapper)
    let targetH = Math.floor(indRect.top - INDICATOR_GAP_PX - wrapRect.top);
    if (!Number.isFinite(targetH) || targetH < 0) targetH = 0;

    wrap.style.setProperty("--content-h", `${targetH}px`);
    return targetH;
  }

  // Hitung banyak baris berdasarkan tinggi tersedia (pakai row-gap baru)
  function rowsForHeight(availableH) {
    const PAGE_PADDING_TOP = 8;
    const eff = Math.max(0, availableH - PAGE_PADDING_TOP);
    const perRow = DESK_CARD_H + DESK_ROW_GAP;
    const maxRows = Math.floor((eff + DESK_ROW_GAP) / perRow);
    return Math.max(2, maxRows);
  }

  // Justify adaptif (center/spread)
  function updateDesktopJustify() {
    if (!isDesktopMode) return;
    document.querySelectorAll(".page-promag").forEach((page) => {
      const wrapW  = page.getBoundingClientRect().width;
      const trackW = DESK_COLS * DESK_CARD_W + (DESK_COLS - 1) * DESK_COL_GAP;
      const leftover = wrapW - trackW;
      const useSpread = leftover >= 0 && (leftover <= 120 || leftover / Math.max(wrapW, 1) <= 0.15);
      page.classList.toggle("page-justify-spread", useSpread);
      page.classList.toggle("page-justify-center", !useSpread);
    });
  }

  // Template 1 kartu
  function createCardHTML(p) {
    const pct = clampProgress(p.progress);
    const color = mixedColor(pct);
    return `
      <div class="card-container-promag">
        <div class="card-promag">
          <div class="card-content-promag">
            <div class="tag-date-wrapper-promag">
              <div class="status-promag">
                <span class="${(p.status || "").replace(/\s+/g, "-").toUpperCase()}">${p.status ?? ""}</span>
              </div>
              <div class="subtitle-tanggal-promag">${p.tanggal ?? ""}</div>
            </div>
            <div class="title-promag">${p.judul ?? ""}</div>
            <div class="lokasi-progress-wrapper-promag">
              <div class="lokasi-progress-promag" style="${p.lokasi_color ? `background-color:${p.lokasi_color};` : ""}">
                ${p.lokasi ?? ""}
              </div>
            </div>
            <div class="subtitle-pj-promag"><span>${p.penanggung_jawab ?? ""}</span></div>
            <div class="perusahaan-promag">
              <span class="${(p.perusahaan || "").replace(/\s+/g, "").toUpperCase()}">${p.perusahaan ?? ""}</span>
            </div>
            <div class="progress-wrapper-promag">
              <div class="progress-title-promag"><span>Progress</span></div>
              <div class="progress-container-promag">
                <div class="progress-bar-promag" style="width:${pct}%; --mix:${pct}%; background-color:${color};"></div>
                <div class="progress-text-promag">${pct}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function paginateDesktop(itemsPerPage) {
    const pages = [];
    for (let i = 0; i < projects.length; i += itemsPerPage) {
      pages.push(projects.slice(i, i + itemsPerPage));
    }
    return pages.length ? pages : [[]];
  }

  // Render
  function renderPages() {
    isDesktopMode = getModeIsDesktop();
    cardPagesContainer.innerHTML = "";
    pageIndicatorsContainer.innerHTML = "";

    cardPagesContainer.classList.toggle("is-carousel", isDesktopMode);
    cardPagesContainer.classList.toggle("is-scroll", !isDesktopMode);

    const showCarouselUI = (show) => {
      [leftArrow, rightArrow, pageIndicatorsContainer, playPauseButton].forEach(el => {
        if (!el) return;
        el.style.display = show ? "" : "none";
      });
    };

    if (isDesktopMode) {
      showCarouselUI(true);

      const availableH = syncContentWrapperHeight();
      const dynRows    = rowsForHeight(availableH);     // min 2
      const itemsPerPage = DESK_COLS * dynRows;         // default 10

      const pages = paginateDesktop(itemsPerPage);
      totalPages = pages.length || 1;

      pages.forEach((data, i) => {
        const pageDiv = document.createElement("div");
        pageDiv.className = "page-promag";
        pageDiv.dataset.page = i;
        pageDiv.innerHTML = data.map(createCardHTML).join("");
        cardPagesContainer.appendChild(pageDiv);
      });

      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement("div");
        dot.className = "indicator-dot-promag";
        if (i === 0) dot.classList.add("active");
        dot.dataset.page = i;
        pageIndicatorsContainer.appendChild(dot);
      }

      if (!isAutoSliding) {
        isAutoSliding = true;
        playPauseButton && (playPauseButton.textContent = "⏸");
      }
      startAutoSlide();
      showPage(Math.min(currentPage, totalPages - 1));
      updateDesktopJustify();
    } else {
      showCarouselUI(false);
      stopAutoSlide();
      isAutoSliding = false;
      playPauseButton && (playPauseButton.textContent = "▶");

      const pageDiv = document.createElement("div");
      pageDiv.className = "page-promag page-promag--single";
      pageDiv.dataset.page = 0;
      pageDiv.innerHTML = projects.map(createCardHTML).join("");
      cardPagesContainer.appendChild(pageDiv);

      totalPages = 1;
      currentPage = 0;
      cardPagesContainer.style.transform = "none";

      syncContentWrapperHeight();
    }
  }

  function showPage(index) {
    if (!isDesktopMode) return;
    if (index < 0 || index >= totalPages) return;

    currentPage = Math.max(0, Math.min(index, totalPages - 1));
    const px = getPageWidth();
    cardPagesContainer.style.transform = `translateX(${-currentPage * px}px)`;

    document.querySelectorAll(".indicator-dot-promag")
      .forEach((dot, i) => dot.classList.toggle("active", i === currentPage));

    // pindah halaman bisa ubah tinggi — sinkron lagi
    syncContentWrapperHeight();
    updateDesktopJustify();
  }

  function startAutoSlide() {
    stopAutoSlide();
    if (!isDesktopMode || !isAutoSliding || totalPages <= 0) return;
    autoSlideInterval = setInterval(() => {
      if (currentPage < totalPages - 1) showPage(currentPage + 1);
      else if (typeof window.goToNextNav === "function") window.goToNextNav();
      else showPage(0);
    }, SLIDE_INTERVAL);
  }

  function stopAutoSlide() { if (autoSlideInterval) { clearInterval(autoSlideInterval); autoSlideInterval = null; } }
  window.stopAutoSlide = stopAutoSlide;

  function toggleAutoSlide() {
    isAutoSliding = !isAutoSliding;
    if (playPauseButton) playPauseButton.textContent = isAutoSliding ? "⏸" : "▶";
    if (isDesktopMode) (isAutoSliding ? startAutoSlide() : stopAutoSlide());
    syncContentWrapperHeight();
    updateDesktopJustify();
  }

  // Events
  playPauseButton?.addEventListener("click", (e) => { e.stopPropagation(); toggleAutoSlide(); });

  leftArrow?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!isDesktopMode) return;
    stopAutoSlide();
    if (currentPage > 0) showPage(currentPage - 1);
    else if (typeof window.goToPrevNav === "function") window.goToPrevNav();
    else showPage(totalPages - 1);
    if (isAutoSliding) startAutoSlide();
  });

  rightArrow?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!isDesktopMode) return;
    stopAutoSlide();
    if (currentPage < totalPages - 1) showPage(currentPage + 1);
    else if (typeof window.goToNextNav === "function") window.goToNextNav();
    else showPage(0);
    if (isAutoSliding) startAutoSlide();
  });

  pageIndicatorsContainer?.addEventListener("click", (e) => {
    if (!isDesktopMode) return;
    const dot = e.target.closest(".indicator-dot-promag");
    if (!dot) return;
    stopAutoSlide();
    showPage(Number(dot.dataset.page) || 0);
    if (isAutoSliding) startAutoSlide();
  });

  // Init + reflow hooks
  renderPages();

  let resizeTO;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => {
      const wasDesktop = isDesktopMode;
      const prevPage = currentPage;
      renderPages();
      if (isDesktopMode && wasDesktop) showPage(Math.min(prevPage, totalPages - 1));
    }, 120);
  });

  window.addEventListener("load", () => { syncContentWrapperHeight(); updateDesktopJustify(); });
  document.fonts?.ready?.then?.(() => { syncContentWrapperHeight(); updateDesktopJustify(); });
  window.addEventListener("orientationchange", () => { syncContentWrapperHeight(); updateDesktopJustify(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { syncContentWrapperHeight(); updateDesktopJustify(); } });
});
