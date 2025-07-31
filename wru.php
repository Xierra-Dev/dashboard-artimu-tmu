<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>UI WRU</title>
    <link rel="icon" href="favicon.ico">

    <link rel="stylesheet" href="MLoc.css" id="styleMode">
</head>

<body>
    <video autoplay muted loop>
        <source src="C:\xampp\htdocs\WRU\project-root\public\video\VidBG.mp4" type="video/mp4">
    </video>

    <div class="top-bar">
        <div class="left-side">
            <div class="menu-icon" id="menuToggle">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="horizontal-menu" id="horizontalMenu">
                <button class="menu-item" id="menu1Btn">Promag</button>
                <div class="menu-item wru-dropdown-wrapper active" id="wruWrapper">
                    WRU ▾
                    <div class="wru-dropdown" id="wruDropdown">
                        <button class="submenu-item" data-wru="A">M-Loc</button>
                        <button class="submenu-item" data-wru="B">V-Trip</button>
                    </div>
                </div>
                <button class="menu-item" id="menu2Btn">Contract</button>
            </div>
        </div>

        <div class="center-content">
            <div class="line" id="leftLine"></div>
            <div class="logo-wrapper">
                <img src="M-Loc.png" alt="WRU Logo">
            </div>
            <div class="line" id="rightLine"></div>
        </div>

        <div class="play-pause" id="playPauseBtn">⏸</div>
    </div>

    <div class="left-hover-area">
        <div class="arrow-button" id="leftArrow">&lt;</div>
    </div>
    <div class="right-hover-area">
        <div class="arrow-button-right" id="rightArrow">&gt;</div>
    </div>

    <div class="content-wrapper">
        <div class="card-pages" id="cardPages">
            <!-- Pages will be generated dynamically -->
        </div>
    </div>

    <div class="page-indicators" id="pageIndicators"></div>

    <!-- Panggil file JS dengan benar -->
    <script src="wru.js"></script>
</body>

</html>