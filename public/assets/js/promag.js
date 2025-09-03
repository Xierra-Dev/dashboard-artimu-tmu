document.addEventListener("DOMContentLoaded", () => {
  // ==== Data ====
  const projects = (window.PROJECTS || []).slice();

  // ==== Breakpoints ====
  const BP = { DESKTOP_MIN: 1400, TABLET_MIN: 769, MOBILE_STD_MIN: 480 };

  // ===== Desktop layout defaults =====
  const DESK_COLS = 5, DESK_CARD_W = 220, DESK_CARD_H = 210, DESK_COL_GAP = 12, DESK_ROW_GAP = 28;

  const INDICATOR_GAP_PX = 12;
  const SLIDE_INTERVAL = 10000;

  // Elemen
  const playPauseButton = document.getElementById("playPauseBtn");
  const cardPagesContainer = document.getElementById("cardPages");
  const pageIndicatorsContainer = document.getElementById("pageIndicators");
  const leftArrow = document.getElementById("leftArrow");
  const rightArrow = document.getElementById("rightArrow");

  // State
  let currentPage = 0, autoSlideInterval = null, isAutoSliding = true, totalPages = 1, isDesktopMode = false;

  const clampProgress = (val) => {
    const n = Number(val);
    if (!isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  };

  // Warna progress (tetap gradasi merah→hijau)
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
    if (first) return Math.round(first.getBoundingClientRect().width);
    const wrap = document.querySelector(".content-wrapper-promag");
    if (wrap) return Math.round(wrap.getBoundingClientRect().width);
    return Math.round(cardPagesContainer.getBoundingClientRect().width || 1148);
  }

  function syncContentWrapperHeight() {
    const wrap = document.querySelector(".content-wrapper-promag");
    const indicators = document.querySelector(".page-indicators-promag");
    if (!wrap || !indicators) return 0;

    if (!isDesktopMode) {
      wrap.style.removeProperty("--content-h");
      return wrap.getBoundingClientRect().height || 0;
    }

    wrap.style.removeProperty("--content-h");

    const wrapRect = wrap.getBoundingClientRect();
    const indRect  = indicators.getBoundingClientRect();

    let targetH = Math.floor(indRect.top - INDICATOR_GAP_PX - wrapRect.top);
    if (!Number.isFinite(targetH) || targetH < 0) targetH = 0;

    wrap.style.setProperty("--content-h", `${targetH}px`);
    return targetH;
  }

  function rowsForHeight(availableH) {
    const PAGE_PADDING_TOP = 8;
    const eff = Math.max(0, availableH - PAGE_PADDING_TOP);
    const perRow = DESK_CARD_H + DESK_ROW_GAP;
    const maxRows = Math.floor((eff + DESK_ROW_GAP) / perRow);
    return Math.max(2, maxRows);
  }

  function applyDesktopLayoutVars(page) {
    const wrapW = page.getBoundingClientRect().width;

    const baseCardW = DESK_CARD_W, baseCardH = DESK_CARD_H, baseGapX = DESK_COL_GAP, cols = DESK_COLS;
    const baseTrackW = cols * baseCardW + (cols - 1) * baseGapX;
    let leftover = wrapW - baseTrackW;

    let gapX = baseGapX;
    if (leftover > 0) {
      const extraPerGap = leftover / (cols - 1);
      const MAX_EXTRA = 18;
      gapX = baseGapX + Math.min(extraPerGap, MAX_EXTRA);
    }

    let trackW = cols * baseCardW + (cols - 1) * gapX;
    let scale = 1;
    const EPS = 1;
    if (trackW > wrapW - EPS) {
      scale = (wrapW - EPS - (cols - 1) * gapX) / (cols * baseCardW);
      scale = Math.max(0.80, Math.min(1, scale));
      trackW = cols * (baseCardW * scale) + (cols - 1) * gapX;
    }

    page.style.setProperty("--gap-x",  `${gapX}px`);
    page.style.setProperty("--card-w", `${baseCardW * scale}px`);
    page.style.setProperty("--card-h", `${baseCardH * scale}px`);
    page.style.setProperty("--scale",  `${scale}`);

    page.classList.add("page-justify-center");
    page.classList.remove("page-justify-spread");
  }

  function updateDesktopJustify() {
    if (!isDesktopMode) return;
    document.querySelectorAll(".page-promag").forEach(applyDesktopLayoutVars);
  }

  // ====== TEMPLATE CARD ======
  function createCardHTML(p) {
    const pct   = clampProgress(p.progress);
    const color = mixedColor(pct);

    const statusStyle     = p.status_color     ? `background-color:${p.status_color};`       : "";
    const lokasiStyle     = p.lokasi_color     ? `background-color:${p.lokasi_color};`       : "";
    const perusahaanStyle = p.perusahaan_color ? `background-color:${p.perusahaan_color};`   : "";

    // Gunakan client_name bila tersedia, fallback ke lokasi lama
    const clientText = (p.client_name && String(p.client_name).trim())
      ? p.client_name
      : (p.lokasi ?? "");

    const tanggalText = (p.tanggal ?? "") || "";

    return `
      <div class="card-container-promag">
        <div class="card-promag">
          <div class="card-content-promag">
            <div class="tag-date-wrapper-promag">
              <div class="status-promag">
                <span style="${statusStyle}">${p.status ?? ""}</span>
              </div>
              <div class="subtitle-tanggal-promag">${tanggalText}</div>
            </div>

            <div class="title-promag">${p.judul ?? ""}</div>

            <div class="lokasi-progress-wrapper-promag" style="${lokasiStyle}">
              <div class="lokasi-progress-promag">${clientText}</div>
            </div>

            <div class="subtitle-pj-promag"><span>${p.penanggung_jawab ?? ""}</span></div>

            <div class="perusahaan-promag">
              <span style="${perusahaanStyle}">${p.perusahaan ?? ""}</span>
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
      const dynRows    = rowsForHeight(availableH);
      const itemsPerPage = DESK_COLS * dynRows;

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

      updateDesktopJustify();
      showPage(Math.min(currentPage, totalPages - 1));
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
    const px = Math.round(getPageWidth());
    cardPagesContainer.style.transform = `translateX(${-currentPage * px}px)`;

    document.querySelectorAll(".indicator-dot-promag")
      .forEach((dot, i) => dot.classList.toggle("active", i === currentPage));

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
