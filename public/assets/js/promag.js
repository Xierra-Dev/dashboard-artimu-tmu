document.addEventListener("DOMContentLoaded", () => {
  // ==== Data ====
  const projects = (window.PROJECTS || []).slice();

  // ==== Breakpoints ====
  const BP = { DESKTOP_MIN: 1400, TABLET_MIN: 769, MOBILE_STD_MIN: 480 };

  // ===== Desktop layout defaults =====
  const DESK_COLS = 5, DESK_CARD_W = 195, DESK_CARD_H = 180, DESK_COL_GAP = 12, DESK_ROW_GAP = 12;

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

  // Vertikal scaling state
  let lastAvailableH = 0;
  let lastRows = 2;

  // Helper
  const asDash = (v) => {
    const s = (v ?? "").toString().trim();
    return s.length ? s : "-";
  };

  const clampProgress = (val) => {
    const n = Number(val);
    if (!isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  };

  function mixedColor(pct) {
    const t = clampProgress(pct) / 100;
    const red = { r: 255, g: 0,  b: 0 };
    const grn = { r: 34,  g: 255, b: 96 };
    const lerp = (a, b, t2) => Math.round(a + (b - a) * t2);
    return `rgb(${lerp(red.r, grn.r, t)}, ${lerp(red.g, grn.g, t)}, ${lerp(red.b, grn.b, t)})`;
  }

  const getModeIsDesktop = () => window.innerWidth >= BP.DESKTOP_MIN;

  function getPageWidth() {
    const wrap = document.querySelector(".content-wrapper-promag");
    const w = wrap?.getBoundingClientRect().width;
    if (w && Number.isFinite(w)) return Math.round(w);
    const cont = cardPagesContainer.getBoundingClientRect().width;
    return Math.round(cont || 1148);
  }

  // === Tinggi konten (dengan fallback aman) ===
  function syncContentWrapperHeight() {
    const wrap = document.querySelector(".content-wrapper-promag");
    const indicators = document.querySelector(".page-indicators-promag");
    if (!wrap) return 0;

    if (!isDesktopMode) {
      wrap.style.removeProperty("--content-h");
      return wrap.getBoundingClientRect().height || 0;
    }

    wrap.style.removeProperty("--content-h");

    const wrapRect = wrap.getBoundingClientRect();
    const indRect  = indicators ? indicators.getBoundingClientRect() : null;

    let targetH = Number.isFinite(indRect?.top)
      ? Math.floor(indRect.top - INDICATOR_GAP_PX - wrapRect.top)
      : NaN;

    // fallback kalau tidak valid/terlalu kecil
    const fallbackH = Math.floor(window.innerHeight - wrapRect.top - 120);
    if (!Number.isFinite(targetH) || targetH < 200) targetH = Math.max(200, fallbackH);

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
    const rows  = Math.max(2, lastRows || 2);

    const baseW = DESK_CARD_W, baseH = DESK_CARD_H;
    const baseGapX = DESK_COL_GAP, baseGapY = DESK_ROW_GAP;
    const cols = DESK_COLS;
    const EPS = 1;

    const scaleWMax = (wrapW - (cols - 1) * baseGapX - EPS) / (cols * baseW);
    const availH = Math.max(0, lastAvailableH);
    const scaleHMax = availH > 0
      ? (availH - (rows - 1) * baseGapY - EPS) / (rows * baseH)
      : 1;

    let scale = Math.min(scaleWMax, scaleHMax);
    scale = Math.max(0.80, Math.min(1.30, scale));

    const cardW = baseW * scale;
    const cardH = baseH * scale;
    const gapX  = baseGapX * scale;
    const gapY  = baseGapY * scale;

    page.style.setProperty("--card-w", `${cardW}px`);
    page.style.setProperty("--card-h", `${cardH}px`);
    page.style.setProperty("--gap-x",  `${gapX}px`);
    page.style.setProperty("--gap-y",  `${gapY}px`);
    page.style.setProperty("--scale",  `${scale}`);

    page.classList.add("page-justify-center");
    page.classList.remove("page-justify-spread");
  }

  function updateDesktopJustify() {
    if (!isDesktopMode) return;
    lastAvailableH = syncContentWrapperHeight();
    document.querySelectorAll(".page-promag").forEach(applyDesktopLayoutVars);
  }

  // ====== TEMPLATE CARD ======
  function createCardHTML(p) {
    const pct   = clampProgress(p.progress);
    const color = mixedColor(pct);

    const statusStyle     = p.status_color     ? `background-color:${p.status_color};`       : "";
    const lokasiStyle     = p.lokasi_color     ? `background-color:${p.lokasi_color};`       : "";
    const perusahaanStyle = p.perusahaan_color ? `background-color:${p.perusahaan_color};`   : "";

    const statusText     = asDash(p.status);
    const tanggalText    = asDash(p.tanggal);
    const titleText      = asDash(p.judul);
    const clientText     = asDash(p.client_name ?? p.lokasi);
    const pimproText     = asDash(p.penanggung_jawab);
    const perusahaanText = asDash(p.perusahaan);

    return (
      '<div class="card-container-promag">' +
        '<div class="card-promag">' +
          '<div class="card-content-promag">' +
            '<div class="tag-date-wrapper-promag">' +
              '<div class="status-promag">' +
                `<span style="${statusStyle}">${statusText}</span>` +
              '</div>' +
              `<div class="subtitle-tanggal-promag">${tanggalText}</div>` +
            '</div>' +

            `<div class="title-promag">${titleText}</div>` +

            `<div class="lokasi-progress-wrapper-promag" style="${lokasiStyle}">` +
              `<div class="lokasi-progress-promag">${clientText}</div>` +
            '</div>' +

            `<div class="subtitle-pj-promag"><span>${pimproText}</span></div>` +

            '<div class="perusahaan-promag">' +
              `<span style="${perusahaanStyle}">${perusahaanText}</span>` +
            '</div>' +

            // spacer fleksibel: progress selalu di bawah, jarak adaptif
            '<div class="flex-gap-promag"></div>' +

            '<div class="progress-wrapper-promag">' +
              '<div class="progress-title-promag"><span>Progress</span></div>' +
              '<div class="progress-container-promag">' +
                `<div class="progress-bar-promag" style="width:${pct}%; --mix:${pct}%; background-color:${color};"></div>` +
                `<div class="progress-text-promag">${pct}%</div>` +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
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
      const els = [leftArrow, rightArrow, pageIndicatorsContainer, playPauseButton];
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (!el) continue;
        el.style.display = show ? "" : "none";
      }
    };

    if (isDesktopMode) {
      showCarouselUI(true);

      lastAvailableH = syncContentWrapperHeight();
      lastRows       = rowsForHeight(lastAvailableH);

      const itemsPerPage = DESK_COLS * lastRows;
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

      if (!isAutoSliding) { isAutoSliding = true; if (playPauseButton) playPauseButton.textContent = "⏸"; }
      startAutoSlide();

      updateDesktopJustify();
      showPage(Math.min(currentPage, totalPages - 1));
      updateDesktopJustify();
    } else {
      showCarouselUI(false);
      stopAutoSlide();
      isAutoSliding = false;
      if (playPauseButton) playPauseButton.textContent = "▶";

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

    lastAvailableH = syncContentWrapperHeight();

    currentPage = Math.max(0, Math.min(index, totalPages - 1));
    const px = Math.round(getPageWidth());
    cardPagesContainer.style.transform = `translateX(${-currentPage * px}px)`;

    const dots = document.querySelectorAll(".indicator-dot-promag");
    for (let i = 0; i < dots.length; i++) dots[i].classList.toggle("active", i === currentPage);

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
    if (!isDesktopMode) return;
    isAutoSliding = !isAutoSliding;
    if (playPauseButton) playPauseButton.textContent = isAutoSliding ? "⏸" : "▶";
    if (isAutoSliding) startAutoSlide(); else stopAutoSlide();
    updateDesktopJustify();
  }

  // Controls
  if (playPauseButton) { playPauseButton.setAttribute("data-no-toggle","1"); playPauseButton.addEventListener("click",(e)=>{ e.stopPropagation(); toggleAutoSlide(); }); }
  if (leftArrow)  leftArrow.setAttribute("data-no-toggle","1");
  if (rightArrow) rightArrow.setAttribute("data-no-toggle","1");
  if (pageIndicatorsContainer) pageIndicatorsContainer.setAttribute("data-no-toggle","1");

  if (leftArrow) leftArrow.addEventListener("click",(e)=>{ e.stopPropagation(); if(!isDesktopMode) return; stopAutoSlide(); if(currentPage>0) showPage(currentPage-1); else if(typeof window.goToPrevNav==="function") window.goToPrevNav(); else showPage(totalPages-1); if(isAutoSliding) startAutoSlide(); });
  if (rightArrow) rightArrow.addEventListener("click",(e)=>{ e.stopPropagation(); if(!isDesktopMode) return; stopAutoSlide(); if(currentPage<totalPages-1) showPage(currentPage+1); else if(typeof window.goToNextNav==="function") window.goToNextNav(); else showPage(0); if(isAutoSliding) startAutoSlide(); });

  if (pageIndicatorsContainer) pageIndicatorsContainer.addEventListener("click",(e)=>{ if(!isDesktopMode) return; const dot=e.target.closest(".indicator-dot-promag"); if(!dot) return; stopAutoSlide(); showPage(Number(dot.dataset.page)||0); if(isAutoSliding) startAutoSlide(); });

  document.addEventListener("click",(e)=>{ if(e.target.closest('.top-bar,[data-no-toggle="1"],.dropdown,.submenu,.menu-item')) return; const sel=window.getSelection&&window.getSelection(); if(sel && !sel.isCollapsed) return; toggleAutoSlide(); }, true);

  // Init
  renderPages();

  let resizeTO;
  window.addEventListener("resize",()=>{ clearTimeout(resizeTO); resizeTO=setTimeout(()=>{ const wasDesktop=isDesktopMode; const prev=currentPage; renderPages(); if(isDesktopMode && wasDesktop) showPage(Math.min(prev,totalPages-1)); },120); });

  if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then==="function") {
    document.fonts.ready.then(()=>{ lastAvailableH = syncContentWrapperHeight(); updateDesktopJustify(); });
  }
  window.addEventListener("load",()=>{ lastAvailableH = syncContentWrapperHeight(); updateDesktopJustify(); });
  window.addEventListener("orientationchange",()=>{ lastAvailableH = syncContentWrapperHeight(); updateDesktopJustify(); });
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden){ lastAvailableH = syncContentWrapperHeight(); updateDesktopJustify(); } });
});
