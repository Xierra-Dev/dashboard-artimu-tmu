<?php
// app/Models/VTripModel.php
namespace App\Models;

use CodeIgniter\Model;

class VTripModel extends Model
{
    // >> PERUBAHAN: arahkan ke koneksi wru
    protected $DBGroup   = 'wru';

    protected $table      = 'v_trip';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'vehicle_id',
        'people_id',
        'destination_id',
        'leave_date',
        'return_date',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $useTimestamps  = true;
    protected $useSoftDeletes = true;
    protected $createdField   = 'created_at';
    protected $updatedField   = 'updated_at';
    protected $deletedField   = 'deleted_at';

    private function baseJoined()
    {
        return $this->builder()
            ->select("
                v_trip.id,
                people.name AS people_name,
                destination.destination_name AS destination_name,
                vehicle.number_plate,
                vehicle.vehicle_name,
                v_trip.leave_date,
                v_trip.return_date
            ")
            ->join('people',      'people.id = v_trip.people_id')
            ->join('destination', 'destination.id = v_trip.destination_id')
            ->join('vehicle',     'vehicle.id = v_trip.vehicle_id')
            ->where('people.deleted_at IS NULL')
            ->where('destination.deleted_at IS NULL')
            ->where('vehicle.deleted_at IS NULL');
    }

    public function getVTrip(): array
    {
        return $this->baseJoined()
            ->orderBy('v_trip.id', 'ASC')
            ->get()->getResultArray();
    }

    public function getOngoingMinute(?string $nowMinute = null, ?string $tz = null): array
    {
        $tz = $tz ?: (config('App')->appTimezone ?? 'Asia/Jakarta');
        $tzObj = new \DateTimeZone($tz);

        if ($nowMinute === null) {
            $dt = new \DateTime('now', $tzObj);
        } else {
            $dt = \DateTime::createFromFormat('Y-m-d H:i', $nowMinute, $tzObj)
                ?: new \DateTime($nowMinute, $tzObj);
        }

        $minute = $dt->format('Y-m-d H:i');
        $lower = $minute . ':00';
        $upper = $minute . ':59';

        return $this->baseJoined()
            ->where('v_trip.leave_date <=',  $upper)
            ->where('v_trip.return_date >=', $lower)
            ->orderBy('v_trip.id', 'ASC')
            ->get()->getResultArray();
    }

    public function getIntersectingMinute(string $startMinute, string $endMinute): array
    {
        $startLower = date('Y-m-d H:i', strtotime($startMinute)) . ':00';
        $endUpper   = date('Y-m-d H:i', strtotime($endMinute)) . ':59';

        return $this->baseJoined()
            ->where('v_trip.leave_date <=',  $endUpper)
            ->where('v_trip.return_date >=', $startLower)
            ->orderBy('v_trip.id', 'ASC')
            ->get()->getResultArray();
    }
}
