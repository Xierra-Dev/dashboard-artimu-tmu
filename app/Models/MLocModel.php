<?php

// app/Models/VTripModel.php
namespace App\Models;

use CodeIgniter\Model;

class MLocModel extends Model
{
    protected $table      = 'm_loc';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'people_id',
        'destination_id',
        'requestBy',
        'leaveDate',
        'returnDate',
        'created_at',
        'updated_at',
        'deleted_at'
    ];
    protected $useTimestamps  = true;
    protected $useSoftDeletes = true;
    protected $createdField   = 'created_at';
    protected $updatedField   = 'updated_at';
    protected $deletedField   = 'deleted_at';

    public function getMLoc(): array
    {
        return $this->select("
                m_loc.id,
                people.name              AS people_name,
                destination.destination_name AS destination_name,
                m_loc.requestBy,
                m_loc.leaveDate,
                m_loc.returnDate
            ")
            ->join('people',      'people.id = m_loc.people_id')
            ->join('destination', 'destination.id = m_loc.destination_id')
            // filter baris yang di-soft delete di tabel referensi
            ->where('people.deleted_at IS NULL')
            ->where('destination.deleted_at IS NULL')
            ->orderBy('m_loc.id', 'ASC')
            ->findAll();
    }

    public function getAll(): array
    {
        // hasil sudah di-alias agar cocok dengan JS (window.PROJECTS)
        return $this->select("
            people.name                                AS name,
            destination.destination_name               AS location,
            m_loc.requestBy                           AS requestBy,
            m_loc.leaveDate                           AS leaveDate,
            m_loc.returnDate                          AS returnDate
        ")
            ->join('people',      'people.id = m_loc.people_id')
            ->join('destination', 'destination.id = m_loc.destination_id')
            // filter baris yang di-soft delete di tabel referensi
            ->where('people.deleted_at IS NULL')
            ->where('destination.deleted_at IS NULL')
            ->orderBy('m_loc.id', 'ASC')
            ->findAll();
    }
}
