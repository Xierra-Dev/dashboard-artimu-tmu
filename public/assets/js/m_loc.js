// m_loc.js — NON-DESKTOP = 1 HALAMAN KONTINU (tanpa paging/gap)
document.addEventListener("DOMContentLoaded", function () {
  const projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];

  // ===== Konstanta
  const SLIDE_INTERVAL   = 10000;
  const DESKTOP_MIN      = 1400;     // ≥1400 = desktop (paging + autoslide)
  const HEIGHT_RULE_MIN  = 1400;     // batas tinggi konten utk desktop
  const INDICATOR_GAP    = 20;

  // Desktop default: 5 baris x 2 kolom = 10 kartu
  const MIN_ROWS     = 5;
  const MIN_PER_PAGE = 10;
  const EPSILON_PX   = 1;

  // ===== Elemen UI
  const playPauseButton         = document.getElementById("playPauseBtn");
  const menuButton              = document.getElementById("menuToggle");
  const menuDropdown            = document.getElementById("horizontalMenu");
  const contentWrapper          = document.querySelector(".content-wrapper");
  const cardPagesContainer      = document.getElementById("cardPages");
  const pageIndicatorsContainer = document.getElementById("pageIndicators");
  const leftArrow               = document.getElementById("leftArrow");
  const rightArrow              = document.getElementById("rightArrow");

  // ===== State
  let currentPage       = 0;
  let autoSlideInterval = null;
  let isAutoSliding     = true;
  let totalPages        = 0;
  let lastPerPage       = MIN_PER_PAGE;
  let lastModeDesktop   = null;

  // ===== Helpers
  const isDesktopWidth     = () => window.innerWidth >= DESKTOP_MIN;
  const isAutoSlideAllowed = () => window.innerWidth >= DESKTOP_MIN;

  function updatePlayPauseIcon() {
    if (playPauseButton) playPauseButton.textContent = isAutoSliding ? "⏸" : "▶";
  }

  function createCardHTML(p) {
    return `
      <div class="card-container">
        <div class="card">
          <div class="card-left">${p.name ?? ""}</div>
          <div class="card-middle">
            <div class="location">${p.location ?? ""}</div>
            <div class="request">Request by <span>${p.requestBy ?? ""}</span></div>
          </div>
          <div class="card-right">
            <div class="dates">
              <div class="date-label leave">Leave<span>${p.leaveDate ?? ""}</span></div>
              <div class="date-label return">Return<span>${p.returnDate ?? ""}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function generatePages(perPage) {
    const pages = [];
    for (let i = 0; i < projects.length; i += perPage) {
      pages.push(projects.slice(i, i + perPage));
    }
    return pages;
  }

  // Hanya relevan untuk desktop — fallback ikut CSS kecil
  function measureLayout() {
    let rowGap = 10, padV = 20, cardH = 92;

    const samplePage  = cardPagesContainer.querySelector(".page");
    const sampleInner = cardPagesContainer.querySelector(".page-inner");
    const sampleCard  = cardPagesContainer.querySelector(".card");

    if (sampleInner) {
      const si = getComputedStyle(sampleInner);
      rowGap = parseFloat(si.rowGap) || rowGap;
    } else if (samplePage) {
      const spg = getComputedStyle(samplePage);
      rowGap = parseFloat(spg.rowGap) || rowGap;
    }

    if (samplePage) {
      const sp   = getComputedStyle(samplePage);
      const top  = parseFloat(sp.paddingTop) || 0;
      const bot  = parseFloat(sp.paddingBottom) || 0;
      padV = top + bot || padV;
    }

    if (sampleCard) {
      cardH = Math.round(sampleCard.getBoundingClientRect().height) || cardH;
    }

    const cs = getComputedStyle(contentWrapper);
    const paddings =
      (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const borders =
      (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);

    return { rowGap, padV, cardH, paddings, borders };
  }

  // Terapkan batas tinggi hanya pada desktop
  function capContentWrapperByIndicators() {
    if (!contentWrapper || !pageIndicatorsContainer) return;

    if (!isDesktopWidth() || window.innerWidth < HEIGHT_RULE_MIN) {
      contentWrapper.style.maxHeight = "";
      contentWrapper.style.height    = "";
      cardPagesContainer.style.height = "";
      return;
    }

    const indRect = pageIndicatorsContainer.getBoundingClientRect();
    const cwRect  = contentWrapper.getBoundingClientRect();
    let target    = Math.floor(indRect.top - 20 - cwRect.top);

    const { rowGap, cardH, paddings, borders } = measureLayout();
    const minInnerForRows = (cardH * MIN_ROWS) + rowGap * (MIN_ROWS - 1);
    const minOuterForRows = Math.ceil(minInnerForRows + paddings + borders);
    const finalMax        = Math.max(Math.max(target, 200), minOuterForRows);

    contentWrapper.style.maxHeight = finalMax + "px";
    const inner = Math.max(0, finalMax - paddings - borders);
    cardPagesContainer.style.height = inner + "px";
  }

  // Non-desktop: padding halaman 0
  function alignPagesCenter() {
    if (!cardPagesContainer) return;
    document.querySelectorAll(".page").forEach((p) => {
      if (isDesktopWidth()) {
        p.style.paddingTop    = "10px";
        p.style.paddingBottom = "10px";
      } else {
        p.style.paddingTop    = "0px";
        p.style.paddingBottom = "0px";
      }
    });
  }

  // Desktop: hitung kapasitas halaman
  function computeCardsPerPage() {
    const h = cardPagesContainer.clientHeight ||
              cardPagesContainer.getBoundingClientRect().height;

    const { rowGap, padV, cardH } = measureLayout();
    const usable = Math.max(0, h - padV);
    const rows   = Math.max(
      MIN_ROWS,
      Math.floor((usable + rowGap + EPSILON_PX) / (cardH + rowGap))
    );
    return Math.max(MIN_PER_PAGE, rows * 2); // 2 kolom
  }

  // Render
  function renderPages(perPage) {
    cardPagesContainer.innerHTML = "";
    pageIndicatorsContainer.innerHTML = "";

    if (!isDesktopWidth()) {
      // === NON-DESKTOP: SATU HALAMAN KONTINU ===
      const pageDiv  = document.createElement("div");
      pageDiv.className = "page";
      pageDiv.style.width = "100%";
      pageDiv.style.minWidth = "100%";
      pageDiv.style.flexShrink = "0";

      const inner = document.createElement("div");
      inner.className = "page-inner";
      inner.innerHTML = projects.map(createCardHTML).join("");

      pageDiv.appendChild(inner);
      cardPagesContainer.appendChild(pageDiv);

      totalPages = 1;
      currentPage = 0;
      cardPagesContainer.style.transform = "none";
      alignPagesCenter();
      return;
    }

    // === DESKTOP: PAGING ===
    const pages = generatePages(perPage);
    totalPages = pages.length;

    pages.forEach((pageData, idx) => {
      const pageDiv  = document.createElement("div");
      pageDiv.className = "page";
      pageDiv.style.width = "100%";
      pageDiv.style.minWidth = "100%";
      pageDiv.style.flexShrink = "0";

      const inner = document.createElement("div");
      inner.className = "page-inner";
      inner.innerHTML = pageData.map(createCardHTML).join("");

      pageDiv.appendChild(inner);
      cardPagesContainer.appendChild(pageDiv);

      const dot = document.createElement("div");
      dot.className = "indicator-dot";
      if (idx === 0) dot.classList.add("active");
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        stopAutoSlide();
        showPage(idx);
        if (isAutoSliding && isAutoSlideAllowed()) startAutoSlide();
      });
      pageIndicatorsContainer.appendChild(dot);
    });

    alignPagesCenter();
  }

  function showPage(index) {
    if (index >= 0 && index < totalPages) {
      currentPage = index;
      const offset = -index * 100;

      if (isDesktopWidth()) {
        cardPagesContainer.style.transform = `translateX(${offset}%)`;
      } else {
        cardPagesContainer.style.transform = "none";
      }

      document.querySelectorAll(".indicator-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === currentPage);
      });

      alignPagesCenter();
      scheduleFix();
    }
  }

  function startAutoSlide() {
    stopAutoSlide();
    if (isAutoSliding && totalPages > 0 && isAutoSlideAllowed()) {
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
  }

  function stopAutoSlide() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
  }
  window.stopAutoSlide = stopAutoSlide;

  function toggleAutoSlide() {
    if (!isAutoSlideAllowed()) {  // non-desktop: selalu OFF
      isAutoSliding = false;
      stopAutoSlide();
      updatePlayPauseIcon();
      return;
    }
    isAutoSliding = !isAutoSliding;
    updatePlayPauseIcon();
    if (isAutoSliding) startAutoSlide();
    else stopAutoSlide();
  }

  function rebuildPages() {
    const nowDesktop = isDesktopWidth();
    const newPerPage = nowDesktop ? computeCardsPerPage() : projects.length;

    // Re-render bila berubah mode atau perPage
    if (lastModeDesktop !== nowDesktop || lastPerPage !== newPerPage) {
      const anchorItemIndex = currentPage * (lastModeDesktop ? lastPerPage : projects.length);
      const wasSliding = isAutoSliding;

      stopAutoSlide();
      lastPerPage = newPerPage;
      lastModeDesktop = nowDesktop;

      renderPages(newPerPage);

      const newIndex = nowDesktop
        ? Math.min(Math.max(Math.floor(anchorItemIndex / newPerPage), 0), Math.max(totalPages - 1, 0))
        : 0;

      showPage(newIndex);

      if (wasSliding && isAutoSlideAllowed()) startAutoSlide();
      alignPagesCenter();
    }
  }

  function handleResponsiveMode() {
    capContentWrapperByIndicators();

    if (!isAutoSlideAllowed()) {
      if (isAutoSliding) {
        isAutoSliding = false;
        stopAutoSlide();
        updatePlayPauseIcon();
      }
      cardPagesContainer.style.transform = "none";
    } else {
      if (isAutoSliding) startAutoSlide();
    }

    rebuildPages();
    alignPagesCenter();
    scheduleFix();
  }

  // Jalankan ulang pengukuran di frame berikutnya
  let rafFix = null;
  function scheduleFix() {
    if (rafFix) cancelAnimationFrame(rafFix);
    rafFix = requestAnimationFrame(() => {
      capContentWrapperByIndicators();
      if (isDesktopWidth()) rebuildPages();
      alignPagesCenter();
    });
  }

  // ===== Events
  playPauseButton?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleAutoSlide();
  });

  // Toggle dengan klik halaman (desktop only)
  document.addEventListener("click", (e) => {
    const insideMenu =
      (menuButton && menuButton.contains(e.target)) ||
      (menuDropdown && menuDropdown.contains(e.target)) ||
      document.getElementById("submenu")?.contains(e.target);
    if (!insideMenu && isAutoSlideAllowed()) {
      toggleAutoSlide();
    }
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

  rightArrow?.addEventListener("click", (e) => {
    e.stopPropagation();
    stopAutoSlide();
    if (currentPage < totalPages - 1) {
      showPage(currentPage + 1);
    } else {
      if (typeof window.goToNextNav === "function") window.goToNextNav();
      else showPage(0);
    }
    if (isAutoSliding && isAutoSlideAllowed()) startAutoSlide();
  });

  window.addEventListener("resize", handleResponsiveMode);
  window.addEventListener("orientationchange", handleResponsiveMode);
  try { window.visualViewport?.addEventListener("resize", handleResponsiveMode); } catch {}

  // ===== Init
  lastModeDesktop = isDesktopWidth();
  lastPerPage = lastModeDesktop ? MIN_PER_PAGE : projects.length;
  renderPages(lastPerPage);
  showPage(0);
  handleResponsiveMode();

  console.log(
    `m_loc.js ready — desktop=${lastModeDesktop}, pages=${totalPages}, perPage=${lastPerPage}, autoslideAllowed=${isAutoSlideAllowed()}`
  );
});
