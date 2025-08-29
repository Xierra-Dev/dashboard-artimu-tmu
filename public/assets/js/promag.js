document.addEventListener("DOMContentLoaded", () => {
  // ==== Data ====
  const projects = (window.PROJECTS || []).slice();

  // ==== Breakpoints ====
  const BP = {
    DESKTOP_MIN: 1400,  // >=1400 => carousel
    TABLET_MIN: 769,    // 769-1399 => single scroll
    MOBILE_STD_MIN: 480 // 480-768  => single scroll
  };

  // ==== Dimensi grid desktop (4 kolom, kartu 280x235, gap 12) ====
  const DESK_COLS   = 4;
  const DESK_CARD_W = 280;
  const DESK_CARD_H = 235;
  const DESK_GAP    = 12;

  // Interval slide (desktop)
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

  // === Helpers umum ===
  const clampProgress = (val) => {
    const n = Number(val);
    if (!isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  };

  // Fallback warna progress
  function mixedColor(pct) {
    const t = clampProgress(pct) / 100;
    const red = { r: 220, g: 53,  b: 69  }; // #DC3545
    const grn = { r: 40,  g: 167, b: 69  }; // #28A745
    const lerp = (a, b, t) => Math.round(a + (b - a) * t);
    return `rgb(${lerp(red.r, grn.r, t)}, ${lerp(red.g, grn.g, t)}, ${lerp(red.b, grn.b, t)})`;
  }

  const getModeIsDesktop = () => window.innerWidth >= BP.DESKTOP_MIN;

  // Lebar page aktual (desktop)
  function getPageWidth() {
    const first = cardPagesContainer.querySelector(".page-promag");
    return first ? first.getBoundingClientRect().width : 1160;
  }

  /* ===========================================================
     Sinkron tinggi wrapper agar 30px di atas indikator
     -> MENGEMBALIKAN nilai tinggi (px) yang dipakai
     =========================================================== */
  function syncContentWrapperHeight() {
    const wrap = document.querySelector(".content-wrapper-promag");
    const indicators = document.querySelector(".page-indicators-promag");
    if (!wrap || !indicators) return 0;

    // mobile/tablet: biarkan auto
    if (!isDesktopMode) {
      wrap.style.removeProperty("--content-h");
      return wrap.getBoundingClientRect().height || 0;
    }

    // Lepas dulu supaya mengukur posisi alami
    wrap.style.removeProperty("--content-h");

    const wrapRect = wrap.getBoundingClientRect();
    const indRect  = indicators.getBoundingClientRect();
    const GAP = 30;

    // target height = top(indicators) - 30 - top(wrapper)
    let targetH = Math.floor(indRect.top - GAP - wrapRect.top);
    if (!Number.isFinite(targetH) || targetH < 0) targetH = 0;

    wrap.style.setProperty("--content-h", `${targetH}px`);
    return targetH;
  }

  /* ===========================================================
     Perhitungan baris dinamis berdasarkan tinggi yang tersedia
     - Satu baris "butuh" tinggi: DESK_CARD_H + DESK_GAP  (~247px)
     - Minimal 2 baris
     =========================================================== */
  function rowsForHeight(availableH) {
    // padding-top pada .page-promag (desktop) = 8px
    const PAGE_PADDING_TOP = 8;
    const eff = Math.max(0, availableH - PAGE_PADDING_TOP);
    const perRow = DESK_CARD_H + DESK_GAP;
    const maxRows = Math.floor((eff + DESK_GAP) / perRow);
    return Math.max(2, maxRows);
  }

  /* ===========================================================
     Alignment adaptif (full kiri–kanan saat sisa kecil,
     center saat zoom-out/sisa besar) dengan gap tetap 12px
     =========================================================== */
  function updateDesktopJustify() {
    if (!isDesktopMode) return;

    const pages = cardPagesContainer.querySelectorAll(".page-promag");
    pages.forEach((page) => {
      const wrapW  = page.getBoundingClientRect().width;
      const trackW = DESK_COLS * DESK_CARD_W + (DESK_COLS - 1) * DESK_GAP; // 4 kartu + 3 gap
      const leftover = wrapW - trackW;

      // Sisa kecil => spread, sisa besar => center
      const useSpread = leftover >= 0 && (leftover <= 120 || leftover / Math.max(wrapW, 1) <= 0.15);
      page.classList.toggle("page-justify-spread", useSpread);
      page.classList.toggle("page-justify-center", !useSpread);
    });
  }

  // View: 1 kartu
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

  // Paginasi desktop dengan jumlah per halaman DINAMIS
  function paginateDesktop(itemsPerPage) {
    const pages = [];
    for (let i = 0; i < projects.length; i += itemsPerPage) {
      pages.push(projects.slice(i, i + itemsPerPage));
    }
    return pages.length ? pages : [[]];
  }

  // Render halaman sesuai mode
  function renderPages() {
    isDesktopMode = getModeIsDesktop();

    // bersihkan
    cardPagesContainer.innerHTML = "";
    pageIndicatorsContainer.innerHTML = "";

    // toggle class untuk CSS
    cardPagesContainer.classList.toggle("is-carousel", isDesktopMode);
    cardPagesContainer.classList.toggle("is-scroll", !isDesktopMode);

    // tampilkan/sembunyikan kontrol
    const showCarouselUI = (show) => {
      [leftArrow, rightArrow, pageIndicatorsContainer, playPauseButton].forEach(el => {
        if (!el) return;
        el.style.display = show ? "" : "none";
      });
    };

    if (isDesktopMode) {
      // ==== DESKTOP: carousel (dinamis) ====
      showCarouselUI(true);

      // Hitung tinggi tersedia & jumlah baris ⟶ items per page
      const availableH = syncContentWrapperHeight();                 // px
      const dynRows    = rowsForHeight(availableH);                  // 2..N
      const itemsPerPage = DESK_COLS * dynRows;                      // 4 * rows

      const pages = paginateDesktop(itemsPerPage);
      totalPages = pages.length || 1;

      pages.forEach((pageData, pageIndex) => {
        const pageDiv = document.createElement("div");
        pageDiv.className = "page-promag";
        pageDiv.setAttribute("data-page", pageIndex);
        pageDiv.innerHTML = pageData.map(createCardHTML).join("");
        cardPagesContainer.appendChild(pageDiv);
      });

      // indikator
      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement("div");
        dot.className = "indicator-dot-promag";
        if (i === 0) dot.classList.add("active");
        dot.dataset.page = i;
        pageIndicatorsContainer.appendChild(dot);
      }

      // auto-slide ON
      if (!isAutoSliding) {
        isAutoSliding = true;
        if (playPauseButton) playPauseButton.textContent = "⏸";
      }
      startAutoSlide();
      showPage(Math.min(currentPage, totalPages - 1));
      updateDesktopJustify();
    } else {
      // ==== TABLET/MOBILE: single scroll ====
      showCarouselUI(false);

      stopAutoSlide();
      isAutoSliding = false;
      if (playPauseButton) playPauseButton.textContent = "▶";

      const pageDiv = document.createElement("div");
      pageDiv.className = "page-promag page-promag--single";
      pageDiv.setAttribute("data-page", 0);
      pageDiv.innerHTML = projects.map(createCardHTML).join("");
      cardPagesContainer.appendChild(pageDiv);

      totalPages = 1;
      currentPage = 0;
      cardPagesContainer.style.transform = "none";

      // tidak perlu sync tinggi / justify khusus
      syncContentWrapperHeight();
    }
  }

  // Tampil halaman (desktop only)
  function showPage(index) {
    if (!isDesktopMode) return;
    if (index < 0 || index >= totalPages) return;

    currentPage = Math.max(0, Math.min(index, totalPages - 1));
    const px = getPageWidth();
    cardPagesContainer.style.transform = `translateX(${-currentPage * px}px)`;
    updateIndicators();

    // pindah halaman bisa mengubah tinggi konten; sinkron lagi
    syncContentWrapperHeight();
    updateDesktopJustify();
  }

  function updateIndicators() {
    document.querySelectorAll(".indicator-dot-promag").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentPage);
    });
  }

  function startAutoSlide() {
    stopAutoSlide();
    if (!isDesktopMode || !isAutoSliding || totalPages <= 0) return;

    autoSlideInterval = setInterval(() => {
      if (currentPage < totalPages - 1) {
        showPage(currentPage + 1);
      } else {
        if (typeof window.goToNextNav === "function") window.goToNextNav();
        else showPage(0);
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
    isAutoSliding = !isAutoSliding;
    if (playPauseButton) playPauseButton.textContent = isAutoSliding ? "⏸" : "▶";
    if (isDesktopMode) {
      isAutoSliding ? startAutoSlide() : stopAutoSlide();
    }
    syncContentWrapperHeight();
    updateDesktopJustify();
  }

  // ===== Events =====
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

  // ==== Init ====
  renderPages();

  // Re-render & resync saat resize/zoom
  let resizeTO;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => {
      const wasDesktop = isDesktopMode;
      const prevPage = currentPage;

      renderPages();

      if (isDesktopMode && wasDesktop) {
        showPage(Math.min(prevPage, totalPages - 1));
      }
    }, 120);
  });

  // Pastikan setelah asset/font ready
  window.addEventListener("load", () => {
    syncContentWrapperHeight();
    updateDesktopJustify();
  });
  document.fonts?.ready?.then?.(() => {
    syncContentWrapperHeight();
    updateDesktopJustify();
  });
  window.addEventListener("orientationchange", () => {
    syncContentWrapperHeight();
    updateDesktopJustify();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncContentWrapperHeight();
      updateDesktopJustify();
    }
  });
});
