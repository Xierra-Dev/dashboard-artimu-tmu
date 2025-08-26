document.addEventListener("DOMContentLoaded", function () {
  const projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];

  const CARDS_PER_PAGE = 8;
  const SLIDE_INTERVAL = 10000;
  const DESKTOP_MIN = 1600; // patokan layout desktop m_loc

  // === Paksa desktop-mode (>=1600px) bila datang dari PROMAG, tapi jangan paksa HP
  const FORCE_QS = "force1600";
  const FORCE_MIN_WIDTH = 769; // ubah ke 1400 jika tablet juga tidak ingin dipaksa
  const canHonorForce = () => window.innerWidth >= FORCE_MIN_WIDTH;

  let force1600 = false;
  try {
    const qs = new URLSearchParams(window.location.search);
    const flagged = qs.get(FORCE_QS) === "1" || sessionStorage.getItem(FORCE_QS) === "1";
    force1600 = flagged && canHonorForce();
  } catch {}

  const playPauseButton = document.getElementById("playPauseBtn");
  const menuButton = document.getElementById("menuToggle");
  const menuDropdown = document.getElementById("horizontalMenu");

  let currentPage = 0;
  const cardPagesContainer = document.getElementById("cardPages");
  const pageIndicatorsContainer = document.getElementById("pageIndicators");
  const leftArrow = document.getElementById("leftArrow");
  const rightArrow = document.getElementById("rightArrow");

  let autoSlideInterval = null;
  let isAutoSliding = true; // bisa diaktifkan di lebar apa pun

  // isDesktopWidth: TRUE jika mode paksa aktif, atau jika >=1600
  const isDesktopWidth = () => (force1600 ? true : window.innerWidth >= DESKTOP_MIN);

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

  function generatePages() {
    const pages = [];
    for (let i = 0; i < projects.length; i += CARDS_PER_PAGE) {
      pages.push(projects.slice(i, i + CARDS_PER_PAGE));
    }
    return pages;
  }

  function renderPages() {
    const pages = generatePages();
    const totalPages = pages.length;

    cardPagesContainer.innerHTML = "";
    pageIndicatorsContainer.innerHTML = "";

    pages.forEach((pageData) => {
      const pageDiv = document.createElement("div");
      pageDiv.className = "page";
      pageDiv.style.width = "100%";
      pageDiv.style.minWidth = "100%";
      pageDiv.style.flexShrink = "0";

      pageData.forEach((p) => {
        pageDiv.innerHTML += createCardHTML(p);
      });

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
        if (isAutoSliding) startAutoSlide();
      });
      pageIndicatorsContainer.appendChild(dot);
    }

    return totalPages;
  }

  const totalPages = renderPages();

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
    }
  }

  function updateIndicators() {
    document.querySelectorAll(".indicator-dot").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentPage);
    });
  }

  function startAutoSlide() {
    stopAutoSlide();
    if (isAutoSliding && totalPages > 0) {
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

  // Ekspos untuk global handler (single page)
  window.stopAutoSlide = stopAutoSlide;

  function toggleAutoSlide() {
    isAutoSliding = !isAutoSliding;
    updatePlayPauseIcon();
    if (isAutoSliding) startAutoSlide();
    else stopAutoSlide();
  }

  // Auto-pause saat masuk ke ≤1599 — KECUALI jika sedang mode paksa (force1600)
  function handleResponsiveMode() {
    if (!isDesktopWidth()) {
      if (isAutoSliding) {
        isAutoSliding = false;
        stopAutoSlide();
        updatePlayPauseIcon();
      }
      cardPagesContainer.style.transform = "none";
    } else {
      if (isAutoSliding) startAutoSlide();
    }
  }

  // Event listeners
  playPauseButton?.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleAutoSlide(); // bisa ON di lebar berapa pun
  });

  document.addEventListener("click", function (e) {
    const insideMenu =
      (menuButton && menuButton.contains(e.target)) ||
      (menuDropdown && menuDropdown.contains(e.target)) ||
      document.getElementById("submenu")?.contains(e.target);
    if (!insideMenu && isDesktopWidth()) {
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
    if (isAutoSliding) startAutoSlide();
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
    if (isAutoSliding) startAutoSlide();
    });


  window.addEventListener("resize", handleResponsiveMode);
  window.addEventListener("orientationchange", handleResponsiveMode);

  // Init
  if (totalPages > 0) {
    showPage(0);
    handleResponsiveMode(); // auto-pause jika bukan desktop / bukan mode paksa
    if (isAutoSliding) startAutoSlide();
  }

  // Bersihkan flag & rapikan URL jika force1600 dipakai
  if (force1600) {
    try {
      sessionStorage.removeItem(FORCE_QS);
      const u = new URL(window.location.href);
      u.searchParams.delete(FORCE_QS);
      window.history.replaceState({}, "", u.pathname + u.hash);
    } catch {}
    document.documentElement.classList.add("force-1600"); // opsional untuk CSS breakpoint
  }

  console.log(`Initialized with ${totalPages} pages, current page: ${currentPage + 1}`);
});
