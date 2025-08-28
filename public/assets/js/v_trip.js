document.addEventListener("DOMContentLoaded", function () {
  const projects = (window.PROJECTS || []).slice();
  const SLIDE_INTERVAL = 10000;

  const HEIGHT_RULE_MIN = 1400;
  const INDICATOR_GAP = 10;
  const CARD_HEIGHT_PX = 105;
  const ROW_GAP_PX = 15;
  const BASE_DESKTOP = 4;
  const BASE_FULLSCREEN = 5;

  const playPauseButton = document.getElementById("playPauseBtn");
  const menuButton = document.getElementById("menuToggle");
  const menuDropdown = document.getElementById("horizontalMenu");

  let currentPage = 0;
  let totalPages = 1;
  let autoSlideInterval = null;
  let isAutoSliding = true;

  const contentWrapper = document.querySelector(".content-wrapper");
  const cardPagesContainer = document.getElementById("cardPages");
  const pageIndicatorsContainer = document.getElementById("pageIndicators");
  const leftArrow = document.getElementById("leftArrow");
  const rightArrow = document.getElementById("rightArrow");

  const isDesktopWidth = () => window.innerWidth >= 1400;
  const isAutoSlideAllowed = () => window.innerWidth >= 1400;

  function isTrueFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  function getMaxPageHeight() {
    let maxH = 0;
    const pages = cardPagesContainer.querySelectorAll(".page");
    pages.forEach((p) => { maxH = Math.max(maxH, p.scrollHeight); });
    return maxH;
  }

  function getAvailableHeightPx() {
    if (!contentWrapper || !pageIndicatorsContainer || !isDesktopWidth()) return 0;
    const indRect = pageIndicatorsContainer.getBoundingClientRect();
    const cwRect  = contentWrapper.getBoundingClientRect();
    let target = Math.floor(indRect.top - INDICATOR_GAP - cwRect.top);
    if (!Number.isFinite(target) || target <= 0) return 0;
    const cs = getComputedStyle(contentWrapper);
    const paddings = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const borders  = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
    return Math.max(0, target - paddings - borders);
  }

  function getCardsPerPageDynamic() {
    if (!isDesktopWidth()) return projects.length || 1;
    const baseline = isTrueFullscreen() ? BASE_FULLSCREEN : BASE_DESKTOP;
    const avail = getAvailableHeightPx();
    if (!avail) return baseline;
    const baselineHeight = baseline * CARD_HEIGHT_PX + (baseline - 1) * ROW_GAP_PX;
    const perCard = CARD_HEIGHT_PX + ROW_GAP_PX;
    const extra = Math.max(0, Math.floor((avail - baselineHeight) / perCard));
    return Math.max(baseline, baseline + extra);
  }

  function capContentWrapperByIndicators() {
    if (!contentWrapper || !pageIndicatorsContainer) return;
    const applyRule = window.innerWidth >= HEIGHT_RULE_MIN;
    if (!applyRule) { contentWrapper.style.maxHeight = ""; return; }

    const indRect = pageIndicatorsContainer.getBoundingClientRect();
    const cwRect  = contentWrapper.getBoundingClientRect();
    let target = Math.floor(indRect.top - INDICATOR_GAP - cwRect.top);
    if (!Number.isFinite(target) || target <= 0) { contentWrapper.style.maxHeight = ""; return; }

    contentWrapper.style.maxHeight = target + "px";
    contentWrapper.style.overflow = "hidden";

    const cs = getComputedStyle(contentWrapper);
    const paddings = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const borders  = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
    const innerH = Math.max(0, target - paddings - borders);
    cardPagesContainer.style.height = innerH + "px";
  }

  function applyContainerHeight() {
    if (!isDesktopWidth()) { cardPagesContainer.style.height = ""; return; }
    const cpp = getCardsPerPageDynamic();
    if (cpp >= 5 && isTrueFullscreen()) {
      requestAnimationFrame(() => {
        const h = getMaxPageHeight();
        cardPagesContainer.style.height = (h ? h + 12 : 660) + "px";
        requestAnimationFrame(capContentWrapperByIndicators);
      });
    } else {
      cardPagesContainer.style.height = "500px";
      requestAnimationFrame(capContentWrapperByIndicators);
    }
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
    requestAnimationFrame(capContentWrapperByIndicators);
  }

  function updatePlayPauseIcon() { if (playPauseButton) playPauseButton.textContent = isAutoSliding ? "⏸" : "▶"; }

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

  function generatePages() {
    const pages = [];
    const CARDS_PER_PAGE = getCardsPerPageDynamic();
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
      dot.className = "indicator-dot"; if (i === 0) dot.classList.add("active"); dot.dataset.page = i;
      pageIndicatorsContainer.appendChild(dot);
    }

    bindIndicatorEvents();
    applyContainerHeight(); applyFullscreenStyling();
    requestAnimationFrame(capContentWrapperByIndicators);
  }

  function bindIndicatorEvents() {
    document.querySelectorAll(".indicator-dot").forEach((dot, index) => {
      dot.addEventListener("click", function (e) {
        e.stopPropagation(); stopAutoSlide(); showPage(index);
        if (isAutoSliding) startAutoSlide();
      });
    });
  }

  function showPage(index) {
    if (index >= 0 && index < totalPages) {
      currentPage = index; const offset = -index * 100;
      cardPagesContainer.style.transform = `translateX(${offset}%)`;
      updateIndicators(); requestAnimationFrame(capContentWrapperByIndicators);
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
      // Versi B: biarkan CSS mengatur nested-scroll (tidak set inline style)
    } else {
      if (isAutoSliding) startAutoSlide();
    }
    requestAnimationFrame(capContentWrapperByIndicators);
  }

  // Controls
  playPauseButton?.addEventListener("click", (e) => { e.stopPropagation(); if (!isAutoSlideAllowed()) return; toggleAutoSlide(); });
  document.addEventListener("click", function (e) {
    const insideMenu =
      (menuButton && menuButton.contains(e.target)) ||
      (menuDropdown && menuDropdown.contains(e.target)) ||
      document.getElementById("submenu")?.contains(e.target);
    if (!insideMenu && isAutoSlideAllowed()) toggleAutoSlide();
  });
  leftArrow?.addEventListener("click", function (e) { e.stopPropagation(); stopAutoSlide(); if (currentPage > 0) showPage(currentPage - 1); else if (typeof window.goToNextNav === "function") window.goToNextNav(); else showPage(0); if (isAutoSliding && window.innerWidth >= 1400) startAutoSlide(); });
  rightArrow?.addEventListener("click", function (e) { e.stopPropagation(); stopAutoSlide(); if (currentPage < totalPages - 1) showPage(currentPage + 1); else if (typeof window.goToNextNav === "function") window.goToNextNav(); else showPage(0); if (isAutoSliding && window.innerWidth >= 1400) startAutoSlide(); });

  // Init & Reflow
  renderPages(); showPage(0);
  isAutoSliding = isAutoSlideAllowed(); updatePlayPauseIcon(); if (isAutoSliding) startAutoSlide();
  applyResponsiveBehavior();

  function reflow() {
    const prev = Math.min(currentPage, totalPages - 1);
    renderPages(); showPage(prev); applyContainerHeight(); applyResponsiveBehavior(); applyFullscreenStyling();
    requestAnimationFrame(capContentWrapperByIndicators);
  }
  let resizeT; const debouncedReflow = () => { clearTimeout(resizeT); resizeT = setTimeout(reflow, 80); };
  window.addEventListener("resize", debouncedReflow);
  window.addEventListener("orientationchange", debouncedReflow);
  document.addEventListener("fullscreenchange", reflow);
  document.addEventListener("webkitfullscreenchange", reflow);
  document.addEventListener("mozfullscreenchange", reflow);
  document.addEventListener("MSFullscreenChange", reflow);
});
