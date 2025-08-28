<?php

namespace App\Controllers;

use App\Controllers\BaseController;
// pakai model yang kamu perlukan (contoh MLocModel sementara)
use App\Models\MLocModel;

class VTrip extends BaseController
{
    public function index()
    {
        $model = new MLocModel();

        return view('pages/v_trip', [
            'title'     => 'V-Trip Dashboard',
            'projects'  => $model->getAll(),
            'pageStyle' => base_url('assets/css/v_trip.css'),
            'pageKey'   => 'vtrip',
            'logoMain'  => 'V-Trip',
            'logoSub'   => 'WRU',
        ]);
    }
}
