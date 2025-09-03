<?php // app/Views/pages/contract.php 
?>

<?= $this->extend('layout/template') ?>

<?= $this->section('content') ?>

<!-- Header kolom (desktop) -->
<div class="project-header">
    <div class="project-header-institusi">Institusi</div>
    <div class="project-header-proyek">Proyek</div>
    <div class="project-header-pt">PT</div>
    <div class="project-header-pimpro">PIMPRO</div>
</div>

<!-- Container kartu -->
<div class="content-wrapper">
    <div class="card-pages" id="cardPages"></div>
</div>

<!-- Page dots (desktop slider) -->
<div class="page-indicators" id="pageIndicators"></div>

<script>
    // Data dari controller (Contract::index) -> $projects
    window.PROJECTS = <?= json_encode($projects ?? [], JSON_UNESCAPED_UNICODE) ?>;
</script>
<script src="<?= base_url('assets/js/contract.js') ?>"></script>

<?= $this->endSection() ?>