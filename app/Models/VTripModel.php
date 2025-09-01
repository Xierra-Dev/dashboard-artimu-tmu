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

    public function getVTrip(): array
    {
        return $this->select("
                v_trip.id,
                people.name              AS people_name,
                destination.destination_name AS destination_name,
                vehicle.numberPlate,
                vehicle.vehicle_name,
                v_trip.requestBy,
                v_trip.leaveDate,
                v_trip.returnDate
            ")
            ->join('people',      'people.id = v_trip.people_id')
            ->join('destination', 'destination.id = v_trip.destination_id')
            ->join('vehicle',     'vehicle.id = v_trip.vehicle_id')
            // filter baris yang di-soft delete di tabel referensi
            ->where('people.deleted_at IS NULL')
            ->where('destination.deleted_at IS NULL')
            ->where('vehicle.deleted_at IS NULL')
            ->orderBy('v_trip.id', 'ASC')
            ->findAll();
    }

    public function getAll(): array
    {
        return $this->select("
            vehicle.numberPlate                                         AS plate,
            vehicle.vehicle_name                                        AS vehicle_name,
            people.name                                                 AS name,
            destination.destination_name                                AS location,
            v_trip.requestBy                                            AS requestBy,
            v_trip.leaveDate                                            AS leaveDate,
            v_trip.returnDate                                           AS returnDate
        ")
            ->join('people',      'people.id = v_trip.people_id', 'left')
            ->join('destination', 'destination.id = v_trip.destination_id', 'left')
            ->join('vehicle',     'vehicle.id = v_trip.vehicle_id', 'left')
            ->where('v_trip.deleted_at', null)
            //kalau ingin di soft delete dari people, destination, dan vehicle
            ->where('people.deleted_at', null)
            ->where('destination.deleted_at', null)
            ->where('vehicle.deleted_at', null)
            ->orderBy('people.name', 'ASC')
            ->orderBy('v_trip.leaveDate', 'ASC')
            ->findAll();
    }
}
