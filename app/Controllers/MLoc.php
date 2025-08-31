<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\MLocModel;

class MLoc extends BaseController
{
    public function index()
    {
        $model = new MLocModel();

        return view('pages/m_loc', [
            'title'     => 'M-Loc Dashboard',
            'projects'  => $model->getAll(),
            'pageStyle' => base_url('assets/css/m_loc.css'),
            'pageKey'   => 'mloc',
            'logoMain'  => 'M-Loc',
            'logoSub'   => 'WRU',
        ]);
    }

    public function json()
    {
        $model = new MLocModel();
        $rows  = $model->getAll();   // sudah alias: name, location, requestBy, leaveDate, returnDate
        return $this->response->setJSON(['data' => $rows]);
    }
}
