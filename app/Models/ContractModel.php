<?php

namespace App\Models;

use CodeIgniter\Model;

class ContractModel extends Model
{
    protected $table          = 'pm_project';
    protected $primaryKey     = 'id';
    protected $returnType     = 'array';
    protected $useSoftDeletes = false;

    /**
     * Ambil kode PT dari pm_company.abbr
     * (sudah Anda minta sebelumnya).
     */
    protected $companyNameField = 'abbr';

    /** Format tanggal ke "dd M yy" atau "-" bila kosong */
    private function fmtDate(?string $d): string
    {
        if (!$d || $d === '0000-00-00') return '-';
        $ts = strtotime($d);
        return $ts ? date('d M y', $ts) : '-';
    }

    /**
     * Hitung selisih hari (due - hari_ini) bertanda:
     *  +n = H-n (masih sisa n hari), 0 = hari ini, -n = terlambat n hari
     */
    private function daysUntil(?string $date): ?int
    {
        if (!$date || $date === '0000-00-00') return null;
        try {
            $today = new \DateTimeImmutable('today');  // timezone aplikasi
            $due   = new \DateTimeImmutable($date);
            return (int) $today->diff($due)->format('%r%a');
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Bangun teks & tipe status untuk ribbon.
     * - Jika sudah ada BAST (close): "SELESAI"
     * - Jika belum: "H-n" / "Hari ini" / "Terlambat n hari"
     */
    private function buildStatus(?string $dueDate, ?string $closeDate): array
    {
        // Sudah close/BAST
        if ($closeDate && $closeDate !== '0000-00-00') {
            return ['SELESAI', 'completed', null];
        }

        $days = $this->daysUntil($dueDate);
        if ($days === null) return ['', 'countdown', null]; // tak ada due

        if ($days > 1)   return ["H-$days", 'countdown', $days];
        if ($days === 1) return ["H-1",   'countdown', 1];
        if ($days === 0) return ["Hari ini", 'countdown', 0];

        // Melewati due (negatif)
        return ["Terlambat " . abs($days) . " hari", 'overdue', $days];
    }

    /**
     * Dipanggil dari controller Anda (TIDAK diubah):
     * $model->getAll()
     */
    public function getAll(): array
    {
        $b = $this->db->table($this->table . ' p');

        // Pilih 1 pimpro/PM per project (prioritas as_pimpro=1, lalu terbaru)
        $subPimpro = "
            SELECT pm_project_id, pm_user_id
            FROM (
                SELECT
                    ppu.pm_project_id,
                    ppu.pm_user_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY ppu.pm_project_id
                        ORDER BY (ppu.as_pimpro = '1') DESC,
                                 IFNULL(ppu.updated_at, ppu.created_at) DESC,
                                 ppu.id DESC
                    ) AS rn
                FROM pm_project_user ppu
            ) x
            WHERE x.rn = 1
        ";

        // Ambil BAST (close date) terbaru per project
        $subBast = "
            SELECT pm_project_id, MAX(bast_date) AS bast_date
            FROM pm_project_service
            GROUP BY pm_project_id
        ";

        $companyField = $this->companyNameField;

        $b->select("
            p.id,
            c.client_name            AS institusi,
            p.project_name           AS project_name,
            co.$companyField         AS pt,
            co.color                 AS pt_color,
            u.fullname               AS pimpro,
            p.date_start             AS contract_date,
            p.date_end               AS due_date,
            p.date_delivery          AS delivery_date,
            bast.bast_date           AS close_bast_date,
            p.`desc`                 AS `desc`
        ");

        $b->join('pm_client  c',  'c.id  = p.pm_client_id',  'left');
        $b->join('pm_company co', 'co.id = p.pm_company_id', 'left');
        $b->join("($subPimpro) pim", 'pim.pm_project_id = p.id', 'left', false);
        $b->join('users u', 'u.id = pim.pm_user_id', 'left');
        $b->join("($subBast) bast", 'bast.pm_project_id = p.id', 'left', false);

        $b->orderBy('p.year', 'DESC')
            ->orderBy('p.date_start', 'ASC')
            ->orderBy('p.project_name', 'ASC');

        $rows = $b->get()->getResultArray();

        $projects = [];
        foreach ($rows as $r) {
            $due   = $r['due_date']        ?? null;
            $close = $r['close_bast_date'] ?? null;

            [$statusText, $statusType, $daysToDue] = $this->buildStatus($due, $close);

            $projects[] = [
                'institusi'     => $r['institusi']           ?? '-',
                'proyek'        => $r['project_name']        ?? '-',
                'pt'            => $r['pt']                  ?? '',
                'ptColor'       => $r['pt_color']            ?? '#6b46c1',
                'pimpro'        => $r['pimpro']              ?? '-',
                'contract'      => $this->fmtDate($r['contract_date']   ?? null),
                'dueDate'       => $this->fmtDate($due),
                'deliveryDate'  => $this->fmtDate($r['delivery_date']    ?? null),
                'closeDate'     => $this->fmtDate($close),
                'keterangan'    => $r['desc']                ?? '',
                // === STATUS COUNTDOWN ===
                'status'        => $statusText,   // "H-n" / "Hari ini" / "Terlambat n hari" / "SELESAI"
                'statusType'    => $statusType,   // 'completed' | 'countdown' | 'overdue'
                'daysToDue'     => $daysToDue,    // integer (bisa negatif)
            ];
        }

        return $projects;
    }
}
