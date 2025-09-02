<?php
// app/Controllers/MLoc.php
namespace App\Controllers;

use App\Controllers\BaseController;
use App\Services\MLocService;

class MLoc extends BaseController
{
    /** Halaman HTML */
    public function index()
    {
        $service = new MLocService();
        $rows    = $service->rowsFromRequest($this->request);

        return view('pages/m_loc', [
            'title'     => 'M-Loc Dashboard',
            'projects'  => $rows, // view-mu konsumsi key 'projects'
            'pageStyle' => base_url('assets/css/m_loc.css'),
            'pageKey'   => 'mloc',
            'logoMain'  => 'M-Loc',
            'logoSub'   => 'WRU',
        ]);
    }

    /** Endpoint JSON */
    public function json()
    {
        $service = new MLocService();
        $rows    = $service->rowsFromRequest($this->request);

        return $this->response->setJSON(['data' => $rows]);
    }
}
