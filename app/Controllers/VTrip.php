<?php
// app/Controllers/VTrip.php
namespace App\Controllers;

use App\Controllers\BaseController;
use App\Services\VTripService;

class VTrip extends BaseController
{
    /** Halaman HTML (default: ongoing menit sekarang, bisa diubah via query string) */
    public function index()
    {
        $service = new VTripService();
        $rows    = $service->rowsFromRequest($this->request);

        return view('pages/v_trip', [
            'title'     => 'V-Trip Dashboard',
            'projects'  => $rows,
            'pageStyle' => base_url('assets/css/v_trip.css'),
            'pageKey'   => 'vtrip',
            'logoMain'  => 'V-Trip',
            'logoSub'   => 'WRU',
        ]);
    }

    /** Endpoint JSON terpisah */
    public function json()
    {
        $service = new VTripService();
        $rows    = $service->rowsFromRequest($this->request);

        return $this->response->setJSON(['data' => $rows]);
    }
}
