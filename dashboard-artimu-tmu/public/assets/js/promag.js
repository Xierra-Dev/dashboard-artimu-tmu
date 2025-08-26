document.addEventListener("DOMContentLoaded", function () {
  const projects = (window.PROJECTS || []).slice();

  const SLIDE_INTERVAL = 60000;
  const ROWS_PER_PAGE = 2; // 2 baris tetap

  const playPauseButton = document.getElementById("playPauseBtn");
  const cardPagesContainer = document.getElementById("cardPages");
  const pageIndicatorsContainer = document.getElementById("pageIndicators");
  const leftArrow = document.getElementById("leftArrow");
  const rightArrow = document.getElementById("rightArrow");

  let currentPage = 0;
  let autoSlideInterval = null;
  let isAutoSliding = true;
  let totalPages = 1;
  let CARDS_PER_PAGE = 8; // akan dihitung ulang

  // ========= Utils =========
  const num = (v) => parseFloat(v) || 0;

  function clampProgress(val) {
    const n = Number(val);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
  }

  function mixedColor(pct) {
    const t = clampProgress(pct) / 100;
    const lerp = (a, b) => Math.round(a + (b - a) * t);
    const R = lerp(220, 40);    //  #DC3545 -> #28A745
    const G = lerp(53, 167);
    const B = lerp(69, 69);
    return `rgb(${R}, ${G}, ${B})`;
  }

  // ========= Perhitungan kolom dari lebar KONTENER =========
  function measureCardWidth() {
    // ukur dari style nyata
    const probe = document.createElement("div");
    probe.className = "card-promag";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    document.body.appendChild(probe);
    const w = num(getComputedStyle(probe).width) || 300;
    document.body.removeChild(probe);
    return w;
  }

  function computeColumns() {
    const containerWidth = cardPagesContainer.getBoundingClientRect().width;
    // ambil gap dari CSS .page-promag (default 12px)
    const tmp = document.createElement("div");
    tmp.className = "page-promag";
    tmp.style.position = "absolute";
    tmp.style.visibility = "hidden";
    cardPagesContainer.appendChild(tmp);
    const cs = getComputedStyle(tmp);
    const gap = num(cs.columnGap) || 12;
    const padL = num(cs.paddingLeft);
    const padR = num(cs.paddingRight);
    cardPagesContainer.removeChild(tmp);

    const cardW = measureCardWidth();

    // ruang efektif
    const avail = Math.max(0, containerWidth - padL - padR);

    // rumus kolom muat: floor((avail + gap) / (cardW + gap))
    const cols = Math.max(1, Math.floor((avail + gap) / (cardW + gap)));

    // batasi atas jika perlu (misal monitor super lebar). Boleh dihapus kalau mau tak terbatas.
    return Math.min(cols, 8);
  }

  function computeCardsPerPage() {
    const cols = computeColumns();
    // set ke root agar CSS grid ikut sinkron
    document.documentElement.style.setProperty("--promag-cols", String(cols));
    return ROWS_PER_PAGE * cols;
  }

  // ========= View =========
  function createCardHTML(p) {
    const pct = clampProgress(p.progress);
    const color = mixedColor(pct);
    return `
      <div class="card-container-promag">
        <div class="card-promag">
          <div class="card-content-promag">
            <div class="tag-date-wrapper-promag">
              <div class="status-promag">
                <span class="${(p.status || '').replace(/\s+/g,'-').toUpperCase()}">${p.status ?? ''}</span>
              </div>
              <div class="subtitle-tanggal-promag">${p.tanggal ?? ''}</div>
            </div>

            <div class="title-promag">${p.judul ?? ''}</div>

            <div class="lokasi-progress-wrapper-promag">
              <div class="lokasi-progress-promag" style="${p.lokasi_color ? `background-color:${p.lokasi_color};` : ''}">
                ${p.lokasi ?? ''}
              </div>
            </div>

            <div class="subtitle-pj-promag"><span>${p.penanggung_jawab ?? ''}</span></div>

            <div class="perusahaan-promag">
              <span class="${(p.perusahaan || '').replace(/\s+/g,'').toUpperCase()}">${p.perusahaan ?? ''}</span>
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
      </div>
    `;
  }

  function generatePages() {
    const pages = [];
    for (let i = 0; i < projects.length; i += CARDS_PER_PAGE) {
      pages.push(projects.slice(i, i + CARDS_PER_PAGE));
    }
    return pages.length ? pages : [[]];
  }

  function renderPages() {
    const pages = generatePages();
    const _totalPages = pages.length || 1;

    cardPagesContainer.innerHTML = "";
    pageIndicatorsContainer.innerHTML = "";

    // set --cols pada tiap page dari root
    const cols = getComputedStyle(document.documentElement).getPropertyValue("--promag-cols").trim();

    pages.forEach((pageData) => {
      const pageDiv = document.createElement("div");
      pageDiv.className = "page-promag";
      if (cols) pageDiv.style.setProperty("--cols", cols);
      pageData.forEach((p) => (pageDiv.innerHTML += createCardHTML(p)));
      cardPagesContainer.appendChild(pageDiv);
    });

    for (let i = 0; i < _totalPages; i++) {
      const dot = document.createElement("div");
      dot.className = "indicator-dot-promag";
      if (i === 0) dot.classList.add("active");
      dot.dataset.page = i;
      pageIndicatorsContainer.appendChild(dot);
    }

    cardPagesContainer.classList.add("card-pages-promag");
    pageIndicatorsContainer.classList.add("page-indicators-promag");

    if (typeof window.handleSinglePageCarousel === "function") {
      window.handleSinglePageCarousel();
    }

    return _totalPages;
  }

  function showPage(index) {
    if (index < 0 || index >= totalPages) return;
    currentPage = index;
    const offset = -index * 100;
    cardPagesContainer.style.transform = `translateX(${offset}%)`;
    updateIndicators();
  }

  function updateIndicators() {
    document.querySelectorAll(".indicator-dot-promag").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentPage);
    });
  }

  function startAutoSlide() {
    stopAutoSlide();
    if (!isAutoSliding || totalPages <= 0) return;
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
    isAutoSliding ? startAutoSlide() : stopAutoSlide();
  }

  // ========= Events =========
  playPauseButton?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleAutoSlide();
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
    if (isAutoSliding) startAutoSlide();
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
    if (isAutoSliding) startAutoSlide();
  });

  pageIndicatorsContainer.addEventListener("click", function (e) {
    const dot = e.target.closest(".indicator-dot-promag");
    if (!dot) return;
    stopAutoSlide();
    showPage(Number(dot.dataset.page) || 0);
    if (isAutoSliding) startAutoSlide();
  });

  // ========= Init + Reflow =========
  function layoutAndRender(preserveIndex = 0) {
    CARDS_PER_PAGE = computeCardsPerPage();
    const cur = Math.min(preserveIndex, totalPages - 1);
    totalPages = renderPages();
    showPage(Math.min(cur, totalPages - 1));
  }

  layoutAndRender(0);
  startAutoSlide();

  let resizeTO;
  function reflow() {
    layoutAndRender(currentPage);
  }
  window.addEventListener("resize", () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(reflow, 120);
  });
  window.addEventListener("orientationchange", () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(reflow, 120);
  });
  window.addEventListener("load", reflow);
});
