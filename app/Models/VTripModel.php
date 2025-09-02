<?php
// app/Models/VTripModel.php
namespace App\Models;

use CodeIgniter\Model;

class VTripModel extends Model
{
    protected $table      = 'v_trip';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'vehicle_id',
        'people_id',
        'destination_id',
        'leaveDate',
        'returnDate',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $useTimestamps  = true;
    protected $useSoftDeletes = true;
    protected $createdField   = 'created_at';
    protected $updatedField   = 'updated_at';
    protected $deletedField   = 'deleted_at';

    /**
     * Builder join standar + kolom yang dipilih.
     * Hindari fungsi di kolom tanggal agar index kepakai.
     */
    private function baseJoined()
    {
        return $this->builder()
            ->select("
                v_trip.id,
                people.name AS people_name,
                destination.destination_name AS destination_name,
                vehicle.numberPlate,
                vehicle.vehicle_name,
                v_trip.leaveDate,
                v_trip.returnDate
            ")
            ->join('people',      'people.id = v_trip.people_id')
            ->join('destination', 'destination.id = v_trip.destination_id')
            ->join('vehicle',     'vehicle.id = v_trip.vehicle_id')
            // sembunyikan baris yang di-soft-delete di tabel referensi
            ->where('people.deleted_at IS NULL')
            ->where('destination.deleted_at IS NULL')
            ->where('vehicle.deleted_at IS NULL');
    }

    /** Semua data (tanpa filter waktu) */
    public function getVTrip(): array
    {
        return $this->baseJoined()
            ->orderBy('v_trip.id', 'ASC')
            ->get()->getResultArray();
    }

    /**
     * Trip yang SEDANG berlangsung pada MENIT tertentu (inklusif).
     * $nowMinute: 'Y-m-d H:i' (jika null = waktu server PHP).
     * Logika: leaveDate <= (menit:59) && returnDate >= (menit:00)
     */
    public function getOngoingMinute(?string $nowMinute = null, ?string $tz = null): array
    {
        // pakai timezone dari config, fallback 'Asia/Jakarta'
        $tz = $tz ?: (config('App')->appTimezone ?? 'Asia/Jakarta');
        $tzObj = new \DateTimeZone($tz);

        if ($nowMinute === null) {
            $dt = new \DateTime('now', $tzObj);
        } else {
            // kalau string sudah 'Y-m-d H:i', tetap treat sebagai WIB
            $dt = \DateTime::createFromFormat('Y-m-d H:i', $nowMinute, $tzObj)
                ?: new \DateTime($nowMinute, $tzObj);
        }

        $minute = $dt->format('Y-m-d H:i');

        $lower = $minute . ':00'; // awal menit (inklusif)
        $upper = $minute . ':59'; // akhir menit (inklusif)

        return $this->baseJoined()
            ->where('v_trip.leaveDate <=',  $upper)
            ->where('v_trip.returnDate >=', $lower)
            ->orderBy('v_trip.id', 'ASC')
            ->get()->getResultArray();
    }


    /**
     * Trip yang beririsan dengan rentang MENIT [$startMinute, $endMinute] (inklusif).
     * Format parameter: 'Y-m-d H:i'
     * Logika irisan: leaveDate <= endUpper && returnDate >= startLower
     */
    public function getIntersectingMinute(string $startMinute, string $endMinute): array
    {
        $startLower = date('Y-m-d H:i', strtotime($startMinute)) . ':00';
        $endUpper   = date('Y-m-d H:i', strtotime($endMinute)) . ':59';

        return $this->baseJoined()
            ->where('v_trip.leaveDate <=',  $endUpper)
            ->where('v_trip.returnDate >=', $startLower)
            ->orderBy('v_trip.id', 'ASC')
            ->get()->getResultArray();
    }
}
