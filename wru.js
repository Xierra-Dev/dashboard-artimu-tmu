document.addEventListener("DOMContentLoaded", function () {
    let currentMode = "A"; // Mulai dari M-Loc
    const styleLink = document.getElementById("styleMode");

    // === DATA M-Loc ===
    const projectsMloc = [
        {
            tanggal: '15 Jul 2025',
            nama: 'Elvin Mudhita',
            institusi: 'Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia',
            request_by: 'Putu Eka Wiragita',
            return_date: '15 Jul 2025'
        },
        {
            tanggal: '26 Aug 2025',
            nama: 'Novi Rahayu',
            institusi: 'Institut Sains dan Teknologi Nasional, Jakarta',
            request_by: 'Wahyu Hidayat',
            return_date: '2 Sep 2025'
        }
    ];

    // === DATA V-Trip ===
    const projectsVtrip = [
        {
            no_polisi: 'D 1299 SAX',
            kendaraan: 'Lamborghini Aventador SVJ',
            institusi: 'Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia',
            request_by: 'Putu Eka Wiragita',
            tanggal_from: 'Fri - 18 Jul 2025, 13:00',
            tanggal_return: 'Mon - 21 July 2025, 22:30'
        },
        {
            no_polisi: 'B 8877 XYZ',
            kendaraan: 'Toyota Alphard',
            institusi: 'Institut Sains dan Teknologi Nasional, Jakarta',
            request_by: 'Wahyu Hidayat',
            tanggal_from: 'Tue - 22 Jul 2025, 09:00',
            tanggal_return: 'Fri - 25 July 2025, 20:00'
        }
    ];

    // === TEMPLATE M-Loc ===
    function createCardHTMLMloc(project) {
        return `
        <div class="card">
            <div class="card-left">
                <div class="person-name">${project.nama}</div>
            </div>
            <div class="card-center">
                <div class="institution">${project.institusi}</div>
                <div class="request-by-section">
                    <span class="request-by-label">Request by:</span>
                    <span class="request-by-name">${project.request_by}</span>
                </div>
            </div>
            <div class="card-right">
                <div class="out-label">Date Out:</div>
                <div class="date-out">${project.tanggal}</div>
                <div class="return-label">Return Date:</div>
                <div class="date-return">${project.return_date}</div>
            </div>
        </div>
        `;
    }

    // === TEMPLATE V-Trip ===
    function createCardHTMLVtrip(project) {
        return `
        <div class="card vtrip-card">
            <div class="card-left">
                <div class="vehicle-plate">${project.no_polisi}</div>
                <div class="vehicle-name">${project.kendaraan}</div>
            </div>
            <div class="card-center">
                <div class="institution">${project.institusi}</div>
                <div class="used-by-section">
                    <span class="used-by-label">Used by</span>
                    <span class="used-by-name">${project.request_by}</span>
                </div>
            </div>
            <div class="card-right">
                <div class="from-label">From</div>
                <div class="from-date">${project.tanggal_from}</div>
                <div class="return-label">Return</div>
                <div class="return-date">${project.tanggal_return}</div>
            </div>
        </div>
        `;
    }

    // === RENDER HALAMAN ===
    function renderPages() {
        const container = document.getElementById("cardPages");
        container.innerHTML = "";

        let data;
        if (currentMode === "A") {
            data = projectsMloc;
            styleLink.href = "MLoc.css";
            document.querySelector(".logo-wrapper img").src = "M-Loc.png";
        } else {
            data = projectsVtrip;
            styleLink.href = "VTrip.css";
            document.querySelector(".logo-wrapper img").src = "V-Trip.png";
        }

        data.forEach(project => {
            if (currentMode === "A") {
                container.innerHTML += createCardHTMLMloc(project);
            } else {
                container.innerHTML += createCardHTMLVtrip(project);
            }
        });

        console.log("Mode sekarang:", currentMode);
    }

    // === GANTI MODE OTOMATIS ===
    function toggleModeAuto() {
        currentMode = (currentMode === "A") ? "B" : "A";
        renderPages();
    }

    // === RENDER AWAL ===
    renderPages();

    // === GANTI TIAP 15 DETIK ===
    setInterval(toggleModeAuto, 15000);
});



            // Initialize pages and get total count
            const totalPages = renderPages();
            const pages = document.querySelectorAll(".page");
            const indicatorDots = document.querySelectorAll(".indicator-dot");

            // Menu functionality
            menuButton.addEventListener("click", function(e) {
                e.stopPropagation();
                menuDropdown.classList.toggle("active");
            });

            // Pagination functionality
            function showPage(index) {
                if (index >= 0 && index < totalPages) {
                    currentPage = index;
                    const offset = -index * 100;
                    cardPagesContainer.style.transform = `translateX(${offset}%)`;
                    updateIndicators();
                }
            }

            // Update page indicators
            function updateIndicators() {
                indicatorDots.forEach((dot, index) => {
                    if (index === currentPage) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
            }

            function loadWRUContent(mode) {
                const logoImg = document.querySelector('.logo-wrapper img');

                if (mode === 'A') {
                    logoImg.src = 'M-Loc.png';
                    logoImg.alt = 'M-Loc Logo';
                    currentProjects = projectsMloc; // ganti data ke M-Loc
                } else if (mode === 'B') {
                    logoImg.src = 'V-Trip.png';
                    logoImg.alt = 'V-Trip Logo';
                    currentProjects = projectsVtrip; // ganti data ke V-Trip
                }

                // Render ulang halaman sesuai pilihan
                renderPages();
            }

            document.querySelectorAll(".submenu-item").forEach(item => {
                item.addEventListener("click", function(e) {
                    e.stopPropagation();
                    const mode = item.getAttribute("data-wru"); // "A" atau "B"
                    loadWRUContent(mode);
                    document.getElementById("wruDropdown").classList.remove("show");
                });
            });


            // Auto-slide functionality
            function startAutoSlide() {
                if (isAutoSliding) {
                    autoSlideInterval = setInterval(() => {
                        if (currentPage < totalPages - 1) {
                            showPage(currentPage + 1);
                        } else {
                            showPage(0); // Kembali ke halaman pertama
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

            // Play/Pause button functionality (controls only auto-slide)
            // Function to toggle play/pause
            function togglePlayPause() {
                isAutoSliding = !isAutoSliding;
                playPauseButton.textContent = isAutoSliding ? "⏸" : "▶";

                if (isAutoSliding) {
                    startAutoSlide();
                } else {
                    stopAutoSlide();
                }
            }

            // Play/Pause button functionality (controls only auto-slide)
            playPauseButton.addEventListener("click", function(e) {
                e.stopPropagation();
                togglePlayPause();
            });

            // Global click handler for play/pause and menu closing
            document.addEventListener("click", function(e) {
                // Check if click is on menu elements
                const isClickInsideMenu = menuButton.contains(e.target) ||
                    menuDropdown.contains(e.target) ||
                    wruWrapper.contains(e.target);

                // Check if click is on navigation arrows
                const isClickOnArrows = leftArrow.contains(e.target) ||
                    rightArrow.contains(e.target);

                // Check if click is on page indicators
                const isClickOnIndicators = pageIndicatorsContainer.contains(e.target);

                // Check if click is on play/pause button
                const isClickOnPlayPause = playPauseButton.contains(e.target);

                // Close menu if click is outside menu
                if (!isClickInsideMenu) {
                    menuDropdown.classList.remove("active");
                }

                // Toggle play/pause if click is not on excluded elements
                if (!isClickInsideMenu && !isClickOnArrows && !isClickOnIndicators && !isClickOnPlayPause) {
                    togglePlayPause();
                }
            });

            // Arrow click handlers
            leftArrow.addEventListener("click", function(e) {
                e.stopPropagation();
                stopAutoSlide();
                if (currentPage > 0) {
                    showPage(currentPage - 1);
                } else {
                    showPage(totalPages - 1);
                }
                if (isAutoSliding) {
                    startAutoSlide();
                }
            });

            rightArrow.addEventListener("click", function(e) {
                e.stopPropagation();
                stopAutoSlide();
                if (currentPage < totalPages - 1) {
                    showPage(currentPage + 1);
                } else {
                    showPage(0);
                }
                if (isAutoSliding) {
                    startAutoSlide();
                }
            });

            // Indicator dots click functionality
            indicatorDots.forEach((dot, index) => {
                dot.addEventListener("click", function(e) {
                    e.stopPropagation();
                    stopAutoSlide();
                    showPage(index);
                    if (isAutoSliding) {
                        startAutoSlide();
                    }
                });
            });

            // Global click handler (video cannot be paused - only close menu)
            document.addEventListener("click", function(e) {
                const isClickInsideMenu = menuButton.contains(e.target) || menuDropdown.contains(e.target);
                if (!isClickInsideMenu) {
                    menuDropdown.classList.remove("active");
                }
            });

            // Initialize first page and start auto-slide
            showPage(0);
            startAutoSlide();
        

        // Add empty cards to fill grid
        document.querySelectorAll('.page').forEach(page => {
            const cards = page.querySelectorAll('.card').length;
            const emptyCount = 10 - cards;

            for (let i = 0; i < emptyCount; i++) {
                const emptyCard = document.createElement('div');
                emptyCard.className = 'card empty';
                page.appendChild(emptyCard);
            }
        });