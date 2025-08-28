<?php
// app/Views/contract/index.php
// Menggunakan layout template + partials yang sudah kamu sediakan
?>

<?= $this->extend('layout/template') ?>

<?= $this->section('content') ?>

<!-- Header kolom card -->
<div class="project-header">
    <div class="project-header-institusi">Institusi</div>
    <div class="project-header-proyek">Proyek</div>
    <div class="project-header-pt">PT</div>
    <div class="project-header-pimpro">PIMPRO</div>
</div>

<!-- Area konten kartu + pages (JS akan inject isi) -->
<div class="content-wrapper">
    <div class="card-pages" id="cardPages"></div>
</div>

<!-- Page Indicators -->
<div class="page-indicators" id="pageIndicators"></div>

<script>
    // Inject data dari PHP ke JS (dipakai contract.js)
    window.PROJECTS = <?= json_encode($projects ?? []) ?>;
</script>
<script src="<?= base_url('assets/js/contract.js') ?>"></script>

<?= $this->endSection() ?>