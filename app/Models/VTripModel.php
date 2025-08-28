<?php

namespace App\Models;

use CodeIgniter\Model;

class VTripModel extends Model
{
    // Tidak memakai DB: kembalikan data statis.
    public function getAll(): array
    {
        return [
            [
                'name'       => 'Putu Eka Wiragita',
                'plate'      => 'B 1234 ABC',
                'location'   => 'Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia',
                'requestBy'  => 'Putu Eka Wiragita',
                'leaveDate'  => 'Fri-15 Jul 2025, 10:00',
                'returnDate' => 'Mon-18 Jul 2025, 10:00',
            ],
            [
                'name'       => 'Putu Eka Wiragita',
                'plate'      => 'B 1234 ABC',
                'location'   => 'Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia',
                'requestBy'  => 'Putu Eka Wiragita',
                'leaveDate'  => 'Fri-15 Jul 2025, 10:00',
                'returnDate' => 'Mon-18 Jul 2025, 10:00',
            ],
            [
                'name'       => 'Putu Eka Wiragita',
                'plate'      => 'B 1234 ABC',
                'location'   => 'Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia',
                'requestBy'  => 'Putu Eka Wiragita',
                'leaveDate'  => 'Fri-15 Jul 2025, 10:00',
                'returnDate' => 'Mon-18 Jul 2025, 10:00',
            ],
            [
                'name'       => 'Putu Eka Wiragita',
                'plate'      => 'B 1234 ABC',
                'location'   => 'Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia',
                'requestBy'  => 'Putu Eka Wiragita',
                'leaveDate'  => 'Fri-15 Jul 2025, 10:00',
                'returnDate' => 'Mon-18 Jul 2025, 10:00',
            ],
            [
                'name'       => 'Putu Eka Wiragita',
                'plate'      => 'B 1234 ABC',
                'location'   => 'Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia Sekolah Tinggi Ilmu Pelayaran Jakarta, Indonesia',
                'requestBy'  => 'Putu Eka Wiragita',
                'leaveDate'  => 'Fri-15 Jul 2025, 10:00',
                'returnDate' => 'Mon-18 Jul 2025, 10:00',
            ],
            // Tambahkan item lain di sini bila perlu...
        ];
    }
}
