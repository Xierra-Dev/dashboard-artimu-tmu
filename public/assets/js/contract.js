// CONTRACT — RESPONSIVE STACKED SLIDES + SCROLL-MODE (≤1399px = single page vertical)
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];

  // ===== Layout constants (desktop) =====
  const MIN_CARDS_PER_PAGE_DESKTOP = 5;
  const SLIDE_INTERVAL = 10000;

  const getDotBottomGap = () => {
    const w = window.innerWidth;
    if (w >= 1600) return 50;
    if (w >= 1400) return 40;
    return 24;
  };

  const BASE_ROW_H_DESKTOP = 96;
  const MIN_ROW_H_DESKTOP  = 80;

  // ===== Elements =====
  const playPauseButton         = document.getElementById("playPauseBtn");
  const cardPagesContainer      = document.getElementById("cardPages");
  const pageIndicatorsContainer = document.getElementById("pageIndicators");
  const leftArrow               = document.getElementById("leftArrow");
  const rightArrow              = document.getElementById("rightArrow");

  // ===== Modes =====
  const MODE = { DESKTOP: "desktop", TABLET: "tablet", MOBILE: "mobile" };
  const getMode = () => {
    const w = window.innerWidth;
    if (w >= 1400) return MODE.DESKTOP;
    if (w > 768)  return MODE.TABLET;
    return MODE.MOBILE;
  };

  // ===== State =====
  let mode = getMode();
  let currentPage = 0;
  let totalPages = 1;

  let autoSlideInterval = null;
  let isAutoSliding = true;
  let CARDS_PER_PAGE = 1;

  const isScrollMode = () => mode !== MODE.DESKTOP;

  // ===== NEW: PT badge helper - teks selalu putih =====
  function renderPtBadge(project) {
    const bg = project.ptColor || '#6c43fc';
    // HANYA background yang diset inline;
    // warna teks tidak pernah di-set inline supaya selalu pakai CSS (putih).
    return `<span class="pt-badge" style="background:${bg}">${project.pt ?? ""}</span>`;
  }

  // ===== Helpers =====
  function reflectModeClass() {
    document.documentElement.classList.toggle("contract-scroll-mode", isScrollMode());
  }
  function isAutoSlideAllowed() { return !isScrollMode() && totalPages > 1; }
  function updatePlayPauseLabel() {
    if (!playPauseButton) return;
    if (isScrollMode()) { playPauseButton.textContent = "▶"; return; }
    playPauseButton.textContent = autoSlideInterval ? "⏸" : "▶";
  }

  function calcAvailableHeight() {
    const vpH = window.innerHeight;
    const top = cardPagesContainer.getBoundingClientRect().top;
    let indH = 0;
    if (pageIndicatorsContainer) {
      const r = pageIndicatorsContainer.getBoundingClientRect();
      indH = r.height || 0;
    }
    return Math.max(0, vpH - top - indH - getDotBottomGap());
  }

  function computeDynamicRows() {
    const available = calcAvailableHeight();
    const GAP = 6;
    const paddingTB = 0;

    let base = Math.floor((available - paddingTB + GAP) / (BASE_ROW_H_DESKTOP + GAP));
    if (!Number.isFinite(base) || base < 1) base = 1;

    const used = base * BASE_ROW_H_DESKTOP + (base - 1) * GAP + paddingTB;
    const leftover = Math.max(0, available - used);
    const extra = leftover >= (BASE_ROW_H_DESKTOP * 0.7) ? 1 : 0;

    return Math.max(MIN_CARDS_PER_PAGE_DESKTOP, base + extra);
  }

  function cardsPerPageForMode() {
    if (isScrollMode()) return projects.length || 1;
    return computeDynamicRows();
  }

  // ====== CARD HTML ======
  function createCardHTML(project) {
    const status = (project.status || "").toLowerCase();
    const statusClass =
      status.includes("completed") ? "completed" :
      status.includes("canceled")  ? "canceled"  :
                                     "countdown";

    if (mode === MODE.DESKTOP) {
      return `
        <div class="card">
          <div class="card-institusi">${project.institusi ?? ""}</div>
          <div class="card-proyek">${project.proyek ?? ""}</div>
          <div class="card-pt">${renderPtBadge(project)}</div>
          <div class="card-pimpro">${project.pimpro ?? ""}</div>

          <div class="date-group-1">
            <div class="date-group">
              <span class="date-title-contract">Contract</span>
              <span class="date-value green">${project.contract ?? ""}</span>
            </div>
            <div class="date-group">
              <span class="date-title-dueDate">Due Date</span>
              <span class="date-value red">${project.dueDate ?? ""}</span>
            </div>
          </div>

          <div class="date-group-2">
            <div class="date-group">
              <span class="date-title-delivery">Delivery</span>
              <span class="date-value orange">${project.deliveryDate ?? ""}</span>
            </div>
            <div class="date-group">
              <span class="date-title-close">Close</span>
              <span class="date-value red">${project.closeDate ?? ""}</span>
            </div>
          </div>

          <div class="card-keterangan">${project.keterangan ?? ""}</div>

          <div class="status ${statusClass}">
            <div class="status-value">${project.status ?? ""}</div>
          </div>
        </div>
      `;
    }

    // TABLET
    if (mode === MODE.TABLET) {
      return `
        <div class="card">
          <div class="card-top tablet">
            <div class="card-institusi">${project.institusi ?? ""}</div>
            <div class="status ${statusClass}">
              <div class="status-value">${project.status ?? ""}</div>
            </div>
          </div>

          <div class="card-proyek">${project.proyek ?? ""}</div>
          <div class="card-pt">${renderPtBadge(project)}</div>
          <div class="card-pimpro">${project.pimpro ?? ""}</div>

          <div class="date-group-1">
            <div class="date-group">
              <span class="date-title-contract">Contract</span>
              <span class="date-value green">${project.contract ?? ""}</span>
            </div>
            <div class="date-group">
              <span class="date-title-dueDate">Due Date</span>
              <span class="date-value red">${project.dueDate ?? ""}</span>
            </div>
          </div>

          <div class="date-group-2">
            <div class="date-group">
              <span class="date-title-delivery">Delivery</span>
              <span class="date-value orange">${project.deliveryDate ?? ""}</span>
            </div>
            <div class="date-group">
              <span class="date-title-close">Close</span>
              <span class="date-value red">${project.closeDate ?? ""}</span>
            </div>
          </div>

          <div class="card-keterangan">${project.keterangan ?? ""}</div>
        </div>
      `;
    }

    // MOBILE
    return `
      <div class="card">
        <div class="card-top mobile">
          <div class="status ${statusClass}">
            <div class="status-value">${project.status ?? ""}</div>
          </div>
          <div class="card-institusi">${project.institusi ?? ""}</div>
        </div>

        <div class="card-proyek">${project.proyek ?? ""}</div>
        <div class="card-pt">${renderPtBadge(project)}</div>
        <div class="card-pimpro">${project.pimpro ?? ""}</div>

        <div class="date-group-1">
          <div class="date-group">
            <span class="date-title-contract">Contract</span>
            <span class="date-value green">${project.contract ?? ""}</span>
          </div>
          <div class="date-group">
            <span class="date-title-dueDate">Due Date</span>
            <span class="date-value red">${project.dueDate ?? ""}</span>
          </div>
        </div>

        <div class="date-group-2">
          <div class="date-group">
            <span class="date-title-delivery">Delivery</span>
            <span class="date-value orange">${project.deliveryDate ?? ""}</span>
          </div>
          <div class="date-group">
            <span class="date-title-close">Close</span>
            <span class="date-value red">${project.closeDate ?? ""}</span>
          </div>
        </div>

        <div class="card-keterangan">${project.keterangan ?? ""}</div>
      </div>
    `;
  }

  function generatePagesData() {
    if (isScrollMode()) return [projects.slice()];
    const perPage = Math.max(1, CARDS_PER_PAGE);
    const pages = [];
    for (let i = 0; i < projects.length; i += perPage) {
      pages.push(projects.slice(i, i + perPage));
    }
    return pages;
  }

  function renderPages() {
    const pages = generatePagesData();
    totalPages = Math.max(1, pages.length);

    cardPagesContainer.innerHTML = "";
    if (pageIndicatorsContainer) pageIndicatorsContainer.innerHTML = "";

    pages.forEach((pageData, i) => {
      const pageEl = document.createElement("div");
      pageEl.className = "page";
      pageEl.innerHTML = pageData.map(createCardHTML).join("");
      pageEl.setAttribute("data-index", String(i));
      cardPagesContainer.appendChild(pageEl);
    });

    if (!isScrollMode() && pageIndicatorsContainer && totalPages > 1) {
      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement("div");
        dot.className = "indicator-dot" + (i === 0 ? " active" : "");
        dot.dataset.page = String(i);
        pageIndicatorsContainer.appendChild(dot);
      }
    }
  }

  const pagesEls = () => Array.from(cardPagesContainer.querySelectorAll(".page"));

  function applyRowHeights() {
    if (isScrollMode()) {
      cardPagesContainer.style.removeProperty("--row-h");
      cardPagesContainer.style.height = "auto";
      return;
    }

    const active = pagesEls()[currentPage];
    if (!active) return;

    const cs = getComputedStyle(active);
    const gap = parseFloat(cs.rowGap || cs.gap || 0);
    const paddingTB = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const available = calcAvailableHeight();

    const rowsTarget = Math.max(1, CARDS_PER_PAGE);
    const theoretical = Math.floor((available - paddingTB - gap * (rowsTarget - 1)) / rowsTarget);
    const rowH = Math.max(MIN_ROW_H_DESKTOP, Math.min(BASE_ROW_H_DESKTOP, theoretical));

    cardPagesContainer.style.setProperty("--row-h", `${rowH}px`);
    cardPagesContainer.style.height = `${available}px`;
  }

  function setPagePositions(instant = false) {
    const all = pagesEls();

    if (isScrollMode()) {
      all.forEach((el) => {
        el.style.position = "static";
        if (instant) {
          const prev = el.style.transition;
          el.style.transition = "none";
          el.style.transform = "none";
          void el.offsetHeight;
          el.style.transition = prev || "";
        } else {
          el.style.transform = "none";
          el.style.transition = "none";
        }
        el.classList.add("is-current");
        el.classList.remove("is-left", "is-right");
      });
      cardPagesContainer.style.removeProperty("--row-h");
      cardPagesContainer.style.height = "auto";
      return;
    }

    // Desktop slider
    all.forEach((el, i) => {
      const delta = i - currentPage;
      const tx = `translate3d(${delta * 100}%, 0, 0)`;

      if (instant) {
        const prev = el.style.transition;
        el.style.transition = "none";
        el.style.transform = tx;
        void el.offsetHeight;
        el.style.transition = prev || "";
      } else {
        el.style.transform = tx;
        el.style.transition = "";
      }

      el.classList.toggle("is-current", delta === 0);
      el.classList.toggle("is-left", delta < 0);
      el.classList.toggle("is-right", delta > 0);
    });

    applyRowHeights();
  }

  function updateIndicators() {
    if (!pageIndicatorsContainer || isScrollMode()) return;
    const dots = pageIndicatorsContainer.querySelectorAll(".indicator-dot");
    dots.forEach((dot, i) => dot.classList.toggle("active", i === currentPage));
  }

  function showPage(index, instant = false) {
    if (index < 0 || index >= totalPages) return;
    currentPage = index;
    setPagePositions(instant);
    updateIndicators();
  }

  function startAutoSlide() {
    stopAutoSlide();
    if (!isAutoSlideAllowed()) { updatePlayPauseLabel(); return; }

    autoSlideInterval = setInterval(() => {
      if (currentPage < totalPages - 1) {
        showPage(currentPage + 1);
      } else {
        if (typeof window.goToNextNav === "function") window.goToNextNav();
        else window.location.assign("/promag");
      }
    }, SLIDE_INTERVAL);

    updatePlayPauseLabel();
  }

  function stopAutoSlide() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
    updatePlayPauseLabel();
  }

  function toggleAutoSlide() {
    if (!isAutoSlideAllowed()) { isAutoSliding = false; stopAutoSlide(); return; }
    isAutoSliding = !isAutoSliding;
    if (isAutoSliding) startAutoSlide(); else stopAutoSlide();
  }

  function recalcAndRerender(keepViewport = true) {
    const prevStartIndex = CARDS_PER_PAGE * currentPage;

    mode = getMode();
    reflectModeClass();
    CARDS_PER_PAGE = cardsPerPageForMode();

    renderPages();

    let targetPage = 0;
    if (!isScrollMode() && keepViewport && CARDS_PER_PAGE > 0) {
      targetPage = Math.floor(prevStartIndex / CARDS_PER_PAGE);
      targetPage = Math.max(0, Math.min(targetPage, totalPages - 1));
    }

    showPage(targetPage, true);

    if (isAutoSlideAllowed()) {
      if (isAutoSliding) startAutoSlide(); else stopAutoSlide();
    } else {
      isAutoSliding = false;
      stopAutoSlide();
    }
  }

  // ===== Init =====
  CARDS_PER_PAGE = cardsPerPageForMode();
  reflectModeClass();
  renderPages();
  showPage(0, true);

  if (isAutoSlideAllowed() && isAutoSliding) startAutoSlide();
  else stopAutoSlide();

  // ===== Events =====
  playPauseButton?.addEventListener("click", (e) => { e.stopPropagation(); toggleAutoSlide(); });

  cardPagesContainer?.addEventListener("click", (e) => {
    if (!isAutoSlideAllowed()) return;
    const target = e.target;
    if (target && typeof target.closest === "function") {
      const interactive = target.closest("a, button, [role='button'], input, textarea, select, label");
      if (interactive) return;
    }
    const sel = window.getSelection && window.getSelection();
    if (sel && String(sel).length) return;
    toggleAutoSlide();
  });

  leftArrow?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!isAutoSlideAllowed()) return;
    stopAutoSlide();
    if (currentPage > 0) showPage(currentPage - 1);
    else if (typeof window.goToPrevNav === "function") window.goToPrevNav();
    else showPage(totalPages - 1);
    if (isAutoSliding && isAutoSlideAllowed()) startAutoSlide();
  });

  rightArrow?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!isAutoSlideAllowed()) return;
    stopAutoSlide();
    if (currentPage < totalPages - 1) showPage(currentPage + 1);
    else {
      if (typeof window.goToNextNav === "function") window.goToNextNav();
      else { window.location.assign("/promag"); return; }
    }
    if (isAutoSliding) startAutoSlide();
  });

  pageIndicatorsContainer?.addEventListener("click", (e) => {
    if (!isAutoSlideAllowed()) return;
    const dot = e.target.closest(".indicator-dot");
    if (!dot) return;
    const idx = parseInt(dot.dataset.page || "0", 10);
    stopAutoSlide();
    showPage(idx);
    if (isAutoSliding) startAutoSlide();
  });

  window.addEventListener("resize", () => { setTimeout(() => recalcAndRerender(true), 80); });
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => recalcAndRerender(true));
    ro.observe(cardPagesContainer);
  }
});
