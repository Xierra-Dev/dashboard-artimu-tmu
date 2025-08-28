<?php
// Pastikan ada pageKey untuk state active
$uri  = service('uri');
$page = $pageKey ?? ($uri->getSegment(1) ?: 'vtrip');

// Fallback kalau controller lupa kirim
$logoMain = $logoMain ?? 'V-Trip';
$logoSub  = $logoSub  ?? 'WRU';
?>
<!-- Style untuk panah WRU yang responsif -->
<style>
  #wruArrow {
    display: inline-block;
    font-weight: 700;
    margin-left: 10px;
    margin-bottom: 1px;
    font-size: 1.18em;
    transition: transform .1s ease;
  }

  /* State panah: right (default mobile) */
  #wruArrow.right {
    transform: rotate(0deg);
  }

  /* State panah: down (desktop tertutup) */
  #wruArrow.down {
    transform: rotate(90deg);
    margin-left: 8px;
    margin-bottom: 0;
  }

  /* State panah: up (semua ukuran saat terbuka) */
  #wruArrow.up {
    transform: rotate(-90deg);
    margin-left: 8px;
    margin-bottom: 0;
  }
</style>

<div class="top-bar">
  <div class="left-side">
    <div class="menu-icon" id="menuToggle">
      <?php for ($i = 0; $i < 9; $i++): ?><div></div><?php endfor; ?>
    </div>

    <div class="horizontal-menu" id="horizontalMenu">
      <button class="menu-item<?= $page === 'promag' ? ' active' : '' ?>" type="button" data-href="<?= base_url('promag') ?>">PROMAG</button>

      <div class="dropdown">
        <!-- WRU button dengan panah yang dikelola JavaScript -->
        <button
          id="wruButton"
          class="menu-item<?= in_array($page, ['mloc', 'vtrip']) ? ' active' : '' ?>"
          type="button"
          onclick="toggleDropdown(event)"
          aria-haspopup="true"
          aria-expanded="false">
          WRU
          <span id="wruArrow" class="right" aria-hidden="true">&gt;</span>
        </button>

        <div id="submenu" class="submenu">
          <button class="submenu-item<?= $page === 'mloc' ? ' active' : '' ?>" type="button" data-href="<?= base_url('mloc') ?>">M-Loc</button>
          <button class="submenu-item<?= $page === 'vtrip' ? ' active' : '' ?>" type="button" data-href="<?= base_url('vtrip') ?>">V-Trip</button>
        </div>
      </div>

      <button class="menu-item<?= $page === 'contract' ? ' active' : '' ?>" type="button" data-href="<?= base_url('contract') ?>">CONTRACT</button>
    </div>
  </div>

  <div class="center-content">
    <div class="line" id="leftLine"></div>
    <div class="logo-wrapper">
      <div class="text-logo">
        <div class="logo-main"><?= esc($logoMain) ?></div>
        <div class="logo-subtitle"><?= esc($logoSub) ?></div>
      </div>
    </div>
    <div class="line" id="rightLine"></div>
  </div>

  <div class="play-pause" id="playPauseBtn">⏸</div>
</div>