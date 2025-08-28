<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\PromagModel;

class Promag extends BaseController
{
    public function index()
    {
        $model = new PromagModel();

        return view('pages/promag', [
            'title'     => 'PROMAG Dashboard',
            'projects'  => $model->getAll(),
            'pageStyle' => base_url('assets/css/promag.css'),
            'pageKey'   => 'promag',
            'logoMain'  => 'PROMAG',
            'logoSub'   => 'Project Management',
        ]);
    }
}
