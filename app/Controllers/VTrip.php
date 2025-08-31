<?php

namespace App\Controllers;

use App\Controllers\BaseController;
// pakai model yang kamu perlukan (contoh MLocModel sementara)
use App\Models\VTripModel;

class VTrip extends BaseController
{
    public function index()
    {
        $model = new VTripModel();

        return view('pages/v_trip', [
            'title'     => 'V-Trip Dashboard',
            'projects'  => $model->getAll(),
            'pageStyle' => base_url('assets/css/v_trip.css'),
            'pageKey'   => 'vtrip',
            'logoMain'  => 'V-Trip',
            'logoSub'   => 'WRU',
        ]);
    }

    public function json()
    {
        $model = new VTripModel();
        $rows  = $model->getAll();  // pastikan getAll() sudah join people/destination/vehicle
        // Bentuk respons yang didukung JS kamu: array langsung ATAU {data: [...]}
        return $this->response->setJSON(['data' => $rows]);
    }
}
