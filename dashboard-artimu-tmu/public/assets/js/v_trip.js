document.addEventListener("DOMContentLoaded", function () {
  const projects = (window.PROJECTS || []).slice();
  const SLIDE_INTERVAL = 10000;

  // === Paksa desktop-mode (>=1400px) bila datang dari M-Loc, tapi jangan paksa HP
  const FORCE_QS = "force1400";
  const FORCE_MIN_WIDTH = 769; // ubah 1400 jika tablet juga tidak ingin dipaksa
  const canHonorForce = () => window.innerWidth >= FORCE_MIN_WIDTH;

  let force1400 = false;
  try {
    const qs = new URLSearchParams(window.location.search);
    const flagged = qs.get(FORCE_QS) === "1" || sessionStorage.getItem(FORCE_QS) === "1";
    force1400 = flagged && canHonorForce();
  } catch {}

  // Elemen kontrol
  const playPauseButton = document.getElementById("playPauseBtn");
  const menuButton = document.getElementById("menuToggle");
  const menuDropdown = document.getElementById("horizontalMenu");

  // State
  let currentPage = 0;
  let totalPages = 1;
  let autoSlideInterval = null;
  let isAutoSliding = true;

  const cardPagesContainer = document.getElementById("cardPages");
  const pageIndicatorsContainer = document.getElementById("pageIndicators");
  const leftArrow = document.getElementById("leftArrow");
  const rightArrow = document.getElementById("rightArrow");

  // ===== Helpers
  // (A) Layout desktop (boleh dipaksa dengan force1400)
  const isDesktopWidth = () => (force1400 ? true : window.innerWidth >= 1400);

  // (B) IZIN autoslide (harus mengikuti lebar layar nyata, TANPA force)
  const isAutoSlideAllowed = () => window.innerWidth >= 1400;

  // (C) Fullscreen "beneran" (F11 / Fullscreen API), TANPA heuristik zoom
  function isTrueFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  // 5 kartu HANYA bila desktop + benar2 fullscreen; selain itu 4 kartu
  const getCardsPerPage = () => (isDesktopWidth() && isTrueFullscreen() ? 5 : 4);

  // --- page height
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
    const cpp = getCardsPerPage();
    if (cpp === 5) {
      requestAnimationFrame(() => {
        const h = getMaxPageHeight();
        cardPagesContainer.style.height = (h ? (h + 12) : 660) + "px";
      });
    } else {
      cardPagesContainer.style.height = "500px";
    }
  }

  function applyFullscreenStyling() {
    const contentWrapper = document.querySelector('.content-wrapper');
    if (isTrueFullscreen()) {
      if (pageIndicatorsContainer) pageIndicatorsContainer.style.bottom = '30px';
      if (contentWrapper) contentWrapper.style.paddingTop = '20px';
    } else {
      if (pageIndicatorsContainer) pageIndicatorsContainer.style.bottom = '20px';
      if (contentWrapper) contentWrapper.style.paddingTop = '12px';
    }
  }

  // ===== UI / Auto-slide
  function updatePlayPauseIcon() {
    if (!playPauseButton) return;
    playPauseButton.textContent = isAutoSliding ? "⏸" : "▶";
  }

  function startAutoSlide() {
    // Guard: jangan jalan kalau tidak diizinkan (≤1399)
    if (!isAutoSlideAllowed()) return;
    stopAutoSlide();
    if (!isAutoSliding) return;
    autoSlideInterval = setInterval(() => {
      if (currentPage < totalPages - 1) {
        showPage(currentPage + 1);
      } else {
        // halaman terakhir → pindah modul
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
  // Ekspos untuk handler global (single-page)
  window.stopAutoSlide = stopAutoSlide;

  function toggleAutoSlide() {
    // Blok jika tidak diizinkan (≤1399)
    if (!isAutoSlideAllowed()) return;
    isAutoSliding = !isAutoSliding;
    updatePlayPauseIcon();
    if (isAutoSliding) startAutoSlide();
    else stopAutoSlide();
  }

  // ===== Card templating (tetap seperti sebelumnya)
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
    const CARDS_PER_PAGE = getCardsPerPage();
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
    applyContainerHeight();
    applyFullscreenStyling();

    // Optional: langsung re-check visibilitas kontrol setelah render
    if (typeof window.handleSinglePageCarousel === 'function') {
      window.handleSinglePageCarousel();
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
    }
  }

  function updateIndicators() {
    document.querySelectorAll(".indicator-dot").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentPage);
    });
  }

  // === Auto-pause rule untuk V-Trip: pause saat screen <= 1399px
  function applyResponsiveBehavior() {
    if (!isAutoSlideAllowed()) {
      isAutoSliding = false;
      updatePlayPauseIcon();
      stopAutoSlide();
    } else {
      if (isAutoSliding) startAutoSlide();
    }
  }

  // ===== Controls
  playPauseButton?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!isAutoSlideAllowed()) return; // blok kalau ≤1399
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
    // sudah di halaman pertama -> lintas modul ke sebelumnya
    if (typeof window.goToPrevNav === "function") window.goToPrevNav();
    else showPage(totalPages - 1);
  }
  if (isAutoSliding && window.innerWidth >= 1400) startAutoSlide();
});

rightArrow?.addEventListener("click", function (e) {
  e.stopPropagation();
  stopAutoSlide();
  if (currentPage < totalPages - 1) {
    showPage(currentPage + 1);
  } else {
    // sudah halaman terakhir -> lintas modul ke berikutnya
    if (typeof window.goToNextNav === "function") window.goToNextNav();
    else showPage(0);
  }
  if (isAutoSliding && window.innerWidth >= 1400) startAutoSlide();
});


  // ===== Init
  renderPages();
  showPage(0);

  // Mulai: ON hanya jika lebar nyata >= 1400
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
  }

  let resizeT;
  const debouncedReflow = () => { clearTimeout(resizeT); resizeT = setTimeout(reflow, 80); };

  window.addEventListener("resize", debouncedReflow);
  window.addEventListener("orientationchange", debouncedReflow);
  document.addEventListener("fullscreenchange", reflow);
  document.addEventListener("webkitfullscreenchange", reflow);
  document.addEventListener("mozfullscreenchange", reflow);
  document.addEventListener("MSFullscreenChange", reflow);

  // === Bersihkan flag & URL jika force1400 dipakai (hanya untuk layout)
  if (force1400) {
    try {
      sessionStorage.removeItem(FORCE_QS);
      const u = new URL(window.location.href);
      u.searchParams.delete(FORCE_QS);
      window.history.replaceState({}, "", u.pathname + u.hash);
    } catch {}
    document.documentElement.classList.add("force-1400"); // opsional untuk CSS breakpoint
  }
});
