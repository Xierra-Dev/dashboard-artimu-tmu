<?php

namespace App\Models;

use CodeIgniter\Model;

class ContractModel extends Model
{
    // >> PERUBAHAN: arahkan ke koneksi promag
    protected $DBGroup   = 'promag';

    protected $table      = 'pm_project';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    public function getAll(): array
    {
        $db = $this->db;

        $subService = '(SELECT pm_project_id, MAX(bast_date) AS bast_date
                        FROM pm_project_service
                        GROUP BY pm_project_id) sv';

        $rows = $db->table('pm_project p')
            ->select([
                'p.id              AS project_id',
                'p.project_name',
                'p.date_start',
                'p.date_end',
                'p.date_delivery',
                'p.`desc`         AS keterangan',

                'c.client_name    AS institusi',

                'co.abbr          AS pt_abbr',
                'co.color         AS pt_color',

                'u.fullname       AS pimpro_fullname',

                'sv.bast_date     AS close_bast_date',
            ])
            ->join('pm_client c',        'c.id  = p.pm_client_id',  'left')
            ->join('pm_company co',      'co.id = p.pm_company_id', 'left')
            ->join('pm_project_user pu', 'pu.pm_project_id = p.id AND pu.as_pimpro = "1"', 'left')
            ->join('users u',            'u.id = pu.pm_user_id', 'left')
            ->join($subService,          'sv.pm_project_id = p.id', 'left')
            ->get()
            ->getResultArray();

        $today = new \DateTimeImmutable('today');

        $projects = [];
        foreach ($rows as $r) {
            $dueRaw   = $r['date_end']        ?? null;
            $closeRaw = $r['close_bast_date'] ?? null;

            $contract = $this->fmtDate($r['date_start']    ?? null);
            $due      = $this->fmtDate($dueRaw);
            $delivery = $this->fmtDate($r['date_delivery'] ?? null);
            $close    = $this->fmtDate($closeRaw);

            $daysUntilDue = null;
            if ($this->isValidDate($dueRaw)) {
                $dDue = new \DateTimeImmutable($dueRaw);
                $daysUntilDue = (int) $today->diff($dDue)->format('%r%a');
            }

            $isCompleted = $this->isValidDate($closeRaw);

            if ($isCompleted) {
                $statusText = 'Selesai';
            } elseif ($daysUntilDue !== null) {
                if ($daysUntilDue < 0) {
                    $statusText = 'Terlambat ' . abs($daysUntilDue) . ' hari';
                } elseif ($daysUntilDue === 0) {
                    $statusText = 'Jatuh tempo hari ini';
                } else {
                    $statusText = $daysUntilDue . ' hari lagi';
                }
            } else {
                $statusText = 'Tanpa due date';
            }

            if ($isCompleted) {
                $sortCat = 2;
                $key1    = $this->toTimestamp($closeRaw) ?? PHP_INT_MAX;
            } elseif ($daysUntilDue !== null && $daysUntilDue < 0) {
                $sortCat = 0;
                $key1    = $daysUntilDue;
            } else {
                $sortCat = 1;
                $key1    = $daysUntilDue ?? PHP_INT_MAX;
            }

            $projects[] = [
                'institusi'    => $r['institusi']        ?? '',
                'proyek'       => $r['project_name']     ?? '',
                'pt'           => $r['pt_abbr']          ?? '',
                'ptColor'      => $r['pt_color']         ?? '#6c43fc',
                'pimpro'       => $r['pimpro_fullname']  ?? '',
                'contract'     => $contract,
                'dueDate'      => $due,
                'deliveryDate' => $delivery,
                'closeDate'    => $close,
                'keterangan'   => $r['keterangan']       ?? '',
                'status'       => $statusText,
                '_cat'         => $sortCat,
                '_key'         => $key1,
            ];
        }

        usort($projects, static function ($a, $b) {
            if ($a['_cat'] !== $b['_cat']) {
                return $a['_cat'] <=> $b['_cat'];
            }
            $cmp = $a['_key'] <=> $b['_key'];
            if ($cmp !== 0) {
                return $cmp;
            }
            return strcmp($a['institusi'], $b['institusi']);
        });

        foreach ($projects as &$p) {
            unset($p['_cat'], $p['_key']);
        }

        return $projects;
    }

    private function isValidDate(?string $date): bool
    {
        if (!$date) return false;
        if ($date === '0000-00-00' || $date === '1970-01-01') return false;
        return true;
    }

    private function fmtDate(?string $date): ?string
    {
        if (!$this->isValidDate($date)) return null;
        try {
            return (new \DateTimeImmutable($date))->format('d M y');
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function toTimestamp(?string $date): ?int
    {
        if (!$this->isValidDate($date)) return null;
        try {
            return (new \DateTimeImmutable($date))->getTimestamp();
        } catch (\Throwable $e) {
            return null;
        }
    }
}
