<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\ContractModel;

class Contract extends BaseController
{
    public function index()
    {
        $model = new ContractModel();

        return view('pages/contract', [
            'title'     => 'Contract Dashboard',
            'projects'  => $model->getAll(),
            'pageStyle' => base_url('assets/css/contract.css'),
            'pageKey'   => 'contract',
            'logoMain'  => 'CONTRACT',
            'logoSub'   => 'Contract List',
        ]);
    }
}
