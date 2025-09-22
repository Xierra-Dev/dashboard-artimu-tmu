<?php
// app/Models/MLocModel.php
namespace App\Models;

use CodeIgniter\Model;

class MLocModel extends Model
{
    protected $DBGroup   = 'wru';

    protected $table      = 'm_loc';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'vehicle_id',
        'people_id',
        'destination_id',
        'request_by',
        'leave_date',
        'return_date',
        'letter',        // kolom flag surat
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
        // PAKAI ARRAY -> aman dari salah ketik komentar dalam string
        return $this->builder()
            ->select([
                'm_loc.id',
                'people.name AS people_name',
                'destination.destination_name AS destination_name',
                'm_loc.request_by',
                'm_loc.leave_date',
                'm_loc.return_date',
                'm_loc.letter',
            ])
            ->join('people',      'people.id = m_loc.people_id')
            ->join('destination', 'destination.id = m_loc.destination_id')
            ->where('people.deleted_at IS NULL')
            ->where('destination.deleted_at IS NULL');
    }

    public function getAll(): array
    {
        return $this->baseJoined()
            ->orderBy('m_loc.id', 'ASC')
            ->get()
            ->getResultArray();
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
            ->where('m_loc.leave_date <=',  $upper)
            ->where('m_loc.return_date >=', $lower)
            ->orderBy('m_loc.id', 'ASC')
            ->get()
            ->getResultArray();
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
            ->where('m_loc.leave_date <=',  $endUpper)
            ->where('m_loc.return_date >=', $startLower)
            ->orderBy('m_loc.id', 'ASC')
            ->get()
            ->getResultArray();
    }
}
