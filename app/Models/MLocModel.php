<?php
// app/Models/MLocModel.php
namespace App\Models;

use CodeIgniter\Model;

class MLocModel extends Model
{
    // >> PERUBAHAN: arahkan ke koneksi wru
    protected $DBGroup   = 'wru';

    protected $table      = 'm_loc';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'vehicle_id',
        'people_id',
        'destination_id',
        'requestBy',
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

    private function baseJoined()
    {
        return $this->builder()
            ->select("
                m_loc.id,
                people.name AS people_name,
                destination.destination_name AS destination_name,
                m_loc.requestBy,
                m_loc.leaveDate,
                m_loc.returnDate
            ")
            ->join('people',      'people.id = m_loc.people_id')
            ->join('destination', 'destination.id = m_loc.destination_id');
    }

    public function getAll(): array
    {
        return $this->baseJoined()
            ->orderBy('m_loc.id', 'ASC')
            ->get()->getResultArray();
    }

    public function getOngoingMinute(?string $nowMinute = null, ?string $tz = null): array
    {
        $tz    = $tz ?: (config('App')->appTimezone ?? 'Asia/Jakarta');
        $tzObj = new \DateTimeZone($tz);

        if ($nowMinute === null) {
            $dt = new \DateTime('now', $tzObj);
        } else {
            $dt = \DateTime::createFromFormat('Y-m-d H:i', $nowMinute, $tzObj)
                ?: new \DateTime($nowMinute, $tzObj);
        }

        $minute = $dt->format('Y-m-d H:i');
        $lower  = $minute . ':00';
        $upper  = $minute . ':59';

        return $this->baseJoined()
            ->where('m_loc.leaveDate <=',  $upper)
            ->where('m_loc.returnDate >=', $lower)
            ->orderBy('m_loc.id', 'ASC')
            ->get()->getResultArray();
    }

    public function getIntersectingMinute(string $startMinute, string $endMinute, ?string $tz = null): array
    {
        $tz    = $tz ?: (config('App')->appTimezone ?? 'Asia/Jakarta');
        $tzObj = new \DateTimeZone($tz);

        $start = \DateTime::createFromFormat('Y-m-d H:i', $startMinute, $tzObj)
            ?: new \DateTime($startMinute, $tzObj);
        $end   = \DateTime::createFromFormat('Y-m-d H:i', $endMinute, $tzObj)
            ?: new \DateTime($endMinute, $tzObj);

        $startLower = $start->format('Y-m-d H:i') . ':00';
        $endUpper   = $end->format('Y-m-d H:i')   . ':59';

        return $this->baseJoined()
            ->where('m_loc.leaveDate <=',  $endUpper)
            ->where('m_loc.returnDate >=', $startLower)
            ->orderBy('m_loc.id', 'ASC')
            ->get()->getResultArray();
    }
}
