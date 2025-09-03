<?php

namespace Config;

class Database extends \CodeIgniter\Database\Config
{
    // Jadikan WRU sebagai default group (opsional)
    public string $defaultGroup = 'wru';

    // === DEFAULTS TANPA env() ===
    public array $wru = [
        'DSN'      => '',
        'hostname' => '127.0.0.1',
        'username' => 'root',
        'password' => '',
        'database' => 'wru_db_copy',
        'DBDriver' => 'MySQLi',
        'DBPrefix' => '',
        'pConnect' => false,
        // gunakan konstanta ENVIRONMENT, jangan env() di default property
        'DBDebug'  => (ENVIRONMENT !== 'production'),
        'charset'  => 'utf8mb4',
        'DBCollat' => 'utf8mb4_general_ci',
        'swapPre'  => '',
        'encrypt'  => false,
        'compress' => false,
        'strictOn' => false,
        'failover' => [],
        'port'     => 3306,
    ];

    public array $promag = [
        'DSN'      => '',
        'hostname' => '127.0.0.1',
        'username' => 'root',
        'password' => '',
        'database' => 'artimuco_promag_copy',
        'DBDriver' => 'MySQLi',
        'DBPrefix' => '',
        'pConnect' => false,
        'DBDebug'  => (ENVIRONMENT !== 'production'),
        'charset'  => 'utf8mb4',
        'DBCollat' => 'utf8mb4_general_ci',
        'swapPre'  => '',
        'encrypt'  => false,
        'compress' => false,
        'strictOn' => false,
        'failover' => [],
        'port'     => 3306,
    ];

    public function __construct()
    {
        parent::__construct();

        // === DI SINI BARU BOLEH pakai env() ===
        // WRU
        $this->wru['hostname'] = env('database.wru.hostname', $this->wru['hostname']);
        $this->wru['username'] = env('database.wru.username', $this->wru['username']);
        $this->wru['password'] = env('database.wru.password', $this->wru['password']);
        $this->wru['database'] = env('database.wru.database', $this->wru['database']);
        $this->wru['DBDriver'] = env('database.wru.DBDriver', $this->wru['DBDriver']);
        $this->wru['port']     = (int) env('database.wru.port', $this->wru['port']);
        $this->wru['charset']  = env('database.wru.charset', $this->wru['charset']);
        $this->wru['DBCollat'] = env('database.wru.DBCollat', $this->wru['DBCollat']);

        // PROMAG
        $this->promag['hostname'] = env('database.promag.hostname', $this->promag['hostname']);
        $this->promag['username'] = env('database.promag.username', $this->promag['username']);
        $this->promag['password'] = env('database.promag.password', $this->promag['password']);
        $this->promag['database'] = env('database.promag.database', $this->promag['database']);
        $this->promag['DBDriver'] = env('database.promag.DBDriver', $this->promag['DBDriver']);
        $this->promag['port']     = (int) env('database.promag.port', $this->promag['port']);
        $this->promag['charset']  = env('database.promag.charset', $this->promag['charset']);
        $this->promag['DBCollat'] = env('database.promag.DBCollat', $this->promag['DBCollat']);
    }
}
