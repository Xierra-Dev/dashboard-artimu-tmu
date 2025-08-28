<?php

namespace App\Controllers;

class Home extends BaseController
{
    public function index(): string
    {
        $data['title'] = 'Home Page (#)';
        return view('hello_view', $data);
    }

    public function coba()
    {
        $name = 'coba';

        echo $name;
    }
}
