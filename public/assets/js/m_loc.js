// m_loc.js (tanpa force 1600px)
document.addEventListener("DOMContentLoaded", function () {
  const projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];

  // ===== Konstanta
  const SLIDE_INTERVAL = 10000;
  const DESKTOP_MIN = 1400;          // selaras dengan CSS (≥1400 = desktop)
  const HEIGHT_RULE_MIN = 1400;
  const INDICATOR_GAP = 20;

  // --- Minimum baris/kartu + buffer anti-rounding
  const MIN_ROWS = 2;
  const MIN_PER_PAGE = 8;            // 2 kolom x 4 baris
  const EPSILON_PX = 1;              // buffer 1px melawan pembulatan saat zoom

  // ===== Elemen UI
  const playPauseButton = document.getElementById("playPauseBtn");
  const menuButton = document.getElementById("menuToggle");
  const menuDropdown = document.getElementById("horizontalMenu");
  const contentWrapper = document.querySelector(".content-wrapper");
  const cardPagesContainer = document.getElementById("cardPages");
  const pageIndicatorsContainer = document.getElementById("pageIndicators");
  const leftArrow = document.getElementById("leftArrow");
  const rightArrow = document.getElementById("rightArrow");

  // ===== State
  let currentPage = 0;
  let autoSlideInterval = null;
  let isAutoSliding = true;
  let totalPages = 0;
  let lastPerPage = 10;

  // ===== Helpers
  // Desktop murni dari lebar layar (tanpa force)
  const isDesktopWidth = () => window.innerWidth >= DESKTOP_MIN;

  // Autoslide hanya boleh jika lebar layar nyata ≥ 1400px
  const isAutoSlideAllowed = () => window.innerWidth >= 1400;

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

  // Ukur gap/padding/tinggi kartu yang real
  function measureLayout() {
    let rowGap = 15;
    let padV = 30;
    let cardH = 110;

    const samplePage = cardPagesContainer.querySelector(".page");
    const sampleInner = cardPagesContainer.querySelector(".page-inner");
    const sampleCard = cardPagesContainer.querySelector(".card");

    if (sampleInner) {
      const si = getComputedStyle(sampleInner);
      rowGap = parseFloat(si.rowGap) || rowGap;
    } else if (samplePage) {
      const spg = getComputedStyle(samplePage);
      rowGap = parseFloat(spg.rowGap) || rowGap;
    }

    if (samplePage) {
      const sp = getComputedStyle(samplePage);
      const baseTop = parseFloat(sp.paddingTop) || 0;
      const baseBot = parseFloat(sp.paddingBottom) || 0;
      padV = baseTop + baseBot;
      if (samplePage.dataset.basePadTop === undefined) {
        samplePage.dataset.basePadTop = String(baseTop);
        samplePage.dataset.basePadBottom = String(baseBot);
      }
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

  // Pastikan wrapper cukup tinggi untuk MIN_ROWS
  function capContentWrapperByIndicators() {
    if (!contentWrapper || !pageIndicatorsContainer) return;

    const applyRule = (window.innerWidth >= HEIGHT_RULE_MIN);
    if (!applyRule) {
      contentWrapper.style.maxHeight = "";
      contentWrapper.style.height = "";
      cardPagesContainer.style.height = "";
      return;
    }

    const indRect = pageIndicatorsContainer.getBoundingClientRect();
    const cwRect = contentWrapper.getBoundingClientRect();
    let target = Math.floor(indRect.top - INDICATOR_GAP - cwRect.top);

    const { rowGap, cardH, paddings, borders } = measureLayout();
    const minInnerForTwoRows = (cardH * MIN_ROWS) + rowGap * (MIN_ROWS - 1);
    const minOuterForTwoRows = Math.ceil(minInnerForTwoRows + paddings + borders);

    const finalMax = Math.max(Math.max(target, 200), minOuterForTwoRows);

    contentWrapper.style.maxHeight = finalMax + "px";
    const inner = Math.max(0, finalMax - paddings - borders);
    cardPagesContainer.style.height = inner + "px";
  }

  function alignPagesCenter() {
    if (!cardPagesContainer) return;
    document.querySelectorAll(".page").forEach((p) => {
      const baseTop =
        p.dataset.basePadTop !== undefined ? parseFloat(p.dataset.basePadTop) : 15;
      const baseBot =
        p.dataset.basePadBottom !== undefined ? parseFloat(p.dataset.basePadBottom) : 15;
      p.style.paddingTop = baseTop + "px";
      p.style.paddingBottom = baseBot + "px";
    });
  }

  // Minimum 4 kartu (2 baris) + buffer anti-rounding
  function computeCardsPerPage() {
    if (!isDesktopWidth()) return 8; // list vertikal di non-desktop

    const h =
      cardPagesContainer.clientHeight ||
      cardPagesContainer.getBoundingClientRect().height;

    const { rowGap, padV, cardH } = measureLayout();
    const usable = Math.max(0, h - padV);
    const rows = Math.max(
      MIN_ROWS,
      Math.floor((usable + rowGap + EPSILON_PX) / (cardH + rowGap))
    );
    return Math.max(MIN_PER_PAGE, rows * 2); // 2 kolom
  }

  function renderPages(perPage) {
    const pages = generatePages(perPage);
    totalPages = pages.length;

    cardPagesContainer.innerHTML = "";
    pageIndicatorsContainer.innerHTML = "";

    pages.forEach((pageData) => {
      const pageDiv = document.createElement("div");
      pageDiv.className = "page";
      pageDiv.style.width = "100%";
      pageDiv.style.minWidth = "100%";
      pageDiv.style.flexShrink = "0";

      const inner = document.createElement("div");
      inner.className = "page-inner";

      let buf = "";
      pageData.forEach((p) => { buf += createCardHTML(p); });
      inner.innerHTML = buf;

      pageDiv.appendChild(inner);
      cardPagesContainer.appendChild(pageDiv);
    });

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement("div");
      dot.className = "indicator-dot";
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        stopAutoSlide();
        showPage(i);
        if (isAutoSliding && isAutoSlideAllowed()) startAutoSlide();
      });
      pageIndicatorsContainer.appendChild(dot);
    }

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
      updateIndicators();
      alignPagesCenter();
      scheduleFix();
    }
  }

  function updateIndicators() {
    document.querySelectorAll(".indicator-dot").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentPage);
    });
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
    // Jika tidak diizinkan (≤1399), jangan pernah mengaktifkan
    if (!isAutoSlideAllowed()) {
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
    const newPerPage = computeCardsPerPage();
    if (newPerPage === lastPerPage) return;

    const anchorItemIndex = currentPage * lastPerPage;
    const wasSliding = isAutoSliding;
    stopAutoSlide();

    lastPerPage = newPerPage;
    renderPages(newPerPage);

    const newIndex = Math.min(
      Math.max(Math.floor(anchorItemIndex / newPerPage), 0),
      Math.max(totalPages - 1, 0)
    );
    showPage(newIndex);

    if (wasSliding && isAutoSlideAllowed()) startAutoSlide();
    alignPagesCenter();
  }

  function handleResponsiveMode() {
    capContentWrapperByIndicators();

    // Matikan autoslide pada semua non-desktop (≤1399)
    if (!isAutoSlideAllowed()) {
      if (isAutoSliding) {
        isAutoSliding = false;
        stopAutoSlide();
        updatePlayPauseIcon();
      }
      cardPagesContainer.style.transform = "none";
    } else {
      // Desktop ≥1400: boleh autoslide jika user set ON
      if (isAutoSliding) startAutoSlide();
    }

    rebuildPages();
    alignPagesCenter();
    scheduleFix();
  }

  // Jalankan ulang pengukuran di frame berikutnya (selesai zoom/layout)
  let rafFix = null;
  function scheduleFix() {
    if (rafFix) cancelAnimationFrame(rafFix);
    rafFix = requestAnimationFrame(() => {
      capContentWrapperByIndicators();
      rebuildPages();
      alignPagesCenter();
    });
  }

  // ===== Events
  playPauseButton?.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleAutoSlide();
  });

  // Toggle dengan click di halaman hanya saat autoslide diizinkan (desktop ≥1400)
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
      if (typeof window.goToPrevNav === "function") window.goToPrevNav();
      else showPage(totalPages - 1);
    }
    if (isAutoSliding && isAutoSlideAllowed()) startAutoSlide();
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
    if (isAutoSliding && isAutoSlideAllowed()) startAutoSlide();
  });

  window.addEventListener("resize", handleResponsiveMode);
  window.addEventListener("orientationchange", handleResponsiveMode);
  try { window.visualViewport?.addEventListener("resize", handleResponsiveMode); } catch {}

  // ===== Init
  renderPages(lastPerPage);
  if (totalPages > 0) {
    showPage(0);
    handleResponsiveMode();     // ini akan menonaktifkan autoslide bila ≤1399
    if (isAutoSliding && isAutoSlideAllowed()) startAutoSlide();
  }

  console.log(
    `Initialized with ${totalPages} pages @${lastPerPage} cards/page, current page: ${currentPage + 1}; autoslideAllowed=${isAutoSlideAllowed()}`
  );
});
