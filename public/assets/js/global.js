// ===== Global navbar & submenu (berlaku di semua halaman) =====

// dipanggil dari atribut onclick di navbar.php
window.toggleDropdown = function (e) {
  e.stopPropagation();
  document.getElementById("submenu")?.classList.toggle("show");
};

// tutup submenu kalau klik di luar
document.addEventListener("click", function (e) {
  const dropdown = document.querySelector(".dropdown");
  if (dropdown && !dropdown.contains(e.target)) {
    document.getElementById("submenu")?.classList.remove("show");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Toggle menu horizontal (titik 3x3)
  const menuButton = document.getElementById("menuToggle");
  const menuDropdown = document.getElementById("horizontalMenu");

  menuButton?.addEventListener("click", function (e) {
    e.stopPropagation();
    menuDropdown?.classList.toggle("active");
  });

  // Active state untuk tombol menu atas
  // PERUBAHAN: jangan stopPropagation untuk .menu-item yang punya data-href
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      // set active visual
      menuItems.forEach((btn) => btn.classList.remove("active"));
      item.classList.add("active");

      const href = item.getAttribute("data-href");
      if (!href) {
        // tombol non-link (mis. WRU) tetap cegah bubbling agar dropdown tetap terbuka
        e.stopPropagation();
      }
      // jika ada data-href, biarkan event bubble agar delegasi di <body> menangani navigasi
    });

    // Dukungan middle-click langsung untuk .menu-item link
    item.addEventListener("auxclick", function (e) {
      if (e.button !== 1) return;
      const href = item.getAttribute("data-href");
      if (!href) return;
      e.preventDefault();
      (typeof navigateTo === "function") ? navigateTo(href, true) : window.open(href, "_blank", "noopener");
    });
  });

  // Tutup menu horizontal saat klik di luar
  document.addEventListener("click", function (e) {
    const isClickInsideMenu =
      (menuButton && menuButton.contains(e.target)) ||
      (menuDropdown && menuDropdown.contains(e.target));
    if (!isClickInsideMenu) menuDropdown?.classList.remove("active");
  });

  // ===== Single Page Carousel Control =====
  window.handleSinglePageCarousel = function() {
    const pageIndicators = document.getElementById("pageIndicators");
    const leftArrow = document.getElementById("leftArrow");
    const rightArrow = document.getElementById("rightArrow");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const cardPages = document.getElementById("cardPages");
    const totalPages = pageIndicators?.children.length || 0;

    if (totalPages <= 1) {
      if (pageIndicators) pageIndicators.style.display = 'none';
      if (leftArrow) leftArrow.style.display = 'none';
      if (rightArrow) rightArrow.style.display = 'none';
      if (playPauseBtn) playPauseBtn.style.display = 'none';
      if (cardPages) {
        cardPages.style.transform = 'none';
        cardPages.classList.add('single-page');
      }
      if (window.stopAutoSlide) window.stopAutoSlide();
    } else {
      if (pageIndicators) pageIndicators.style.display = '';
      if (leftArrow) leftArrow.style.display = '';
      if (rightArrow) rightArrow.style.display = '';
      if (playPauseBtn) playPauseBtn.style.display = '';
      if (cardPages) cardPages.classList.remove('single-page');
    }
  };

  setTimeout(() => {
    if (typeof window.handleSinglePageCarousel === 'function') {
      window.handleSinglePageCarousel();
    }
  }, 100);

  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (typeof window.handleSinglePageCarousel === 'function') {
        window.handleSinglePageCarousel();
      }
    }, 150);
  });

  // ===== Delegasi navigasi untuk button[data-href]
  function navigateTo(url, newTab = false) {
    document.getElementById("submenu")?.classList.remove("show");
    document.getElementById("horizontalMenu")?.classList.remove("active");
    if (!url) return;
    if (newTab) window.open(url, "_blank", "noopener");
    else window.location.assign(url);
  }
  // Ekspos ke global scope agar bisa dipakai handler lain
  window.navigateTo = navigateTo;

  document.body.addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-href]");
    if (!btn) return;
    const url = btn.getAttribute("data-href");
    const openNew = e.ctrlKey || e.metaKey;
    e.preventDefault();
    navigateTo(url, openNew);
  });

  document.body.addEventListener("auxclick", function (e) {
    if (e.button !== 1) return;
    const btn = e.target.closest("button[data-href]");
    if (!btn) return;
    const url = btn.getAttribute("data-href");
    e.preventDefault();
    navigateTo(url, true);
  });

  document.body.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = e.target;
    if (!el || !el.matches("button[data-href]")) return;
    const url = el.getAttribute("data-href");
    e.preventDefault();
    navigateTo(url);
  });
});

// ===== Observer untuk perubahan indikator halaman
document.addEventListener("DOMContentLoaded", function() {
  const pageIndicators = document.getElementById("pageIndicators");
  if (pageIndicators) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          if (typeof window.handleSinglePageCarousel === 'function') {
            setTimeout(window.handleSinglePageCarousel, 50);
          }
        }
      });
    });
    observer.observe(pageIndicators, { childList: true, subtree: false });
  }
});

// ====== Helper lintas-halaman (NEXT & PREV) — versi bersih TANPA force flags ======
(function () {
  function buildNavOrder() {
    const menuRoot = document.getElementById("horizontalMenu");
    if (!menuRoot) return [];
    // urutkan sesuai tombol di menu horizontal
    const btns = menuRoot.querySelectorAll("button[data-href]");
    const order = [];
    btns.forEach((b) => {
      const href = b.getAttribute("data-href");
      if (href) {
        const u = new URL(href, location.origin);
        order.push(u.href);
      }
    });
    return order;
  }

  function normalizePath(href) {
    try {
      const u = new URL(href, location.origin);
      return u.pathname.replace(/\/+$/, "") || "/";
    } catch {
      return "/";
    }
  }

  function getNextNavUrl() {
    const order = buildNavOrder();
    if (!order.length) return null;
    const curPath = normalizePath(location.href);
    let curIdx = order.findIndex((u) => normalizePath(u) === curPath);
    if (curIdx === -1) return order[0];
    const nextIdx = (curIdx + 1) % order.length;
    return order[nextIdx];
  }

  function getPrevNavUrl() {
    const order = buildNavOrder();
    if (!order.length) return null;
    const curPath = normalizePath(location.href);
    let curIdx = order.findIndex((u) => normalizePath(u) === curPath);
    if (curIdx === -1) return order[0];
    const prevIdx = (curIdx - 1 + order.length) % order.length;
    return order[prevIdx];
  }

  function goToNextNav() {
    const next = getNextNavUrl();
    if (!next) return;
    document.getElementById("submenu")?.classList.remove("show");
    document.getElementById("horizontalMenu")?.classList.remove("active");
    window.location.assign(next);            // ← tidak menambah query apa pun
  }

  function goToPrevNav() {
    const prev = getPrevNavUrl();
    if (!prev) return;
    document.getElementById("submenu")?.classList.remove("show");
    document.getElementById("horizontalMenu")?.classList.remove("active");
    window.location.assign(prev);            // ← tidak menambah query apa pun
  }

  window.getNextNavUrl = getNextNavUrl;
  window.getPrevNavUrl = getPrevNavUrl;
  window.goToNextNav = goToNextNav;
  window.goToPrevNav = goToPrevNav;
})();
