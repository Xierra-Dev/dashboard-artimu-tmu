<?php

namespace App\Models;

use CodeIgniter\Model;

class PromagModel extends Model
{
    protected $table         = 'pm_project';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = false;

    // optional: biarkan agar CI4 bisa insert/update jika diperlukan
    protected $allowedFields = [
        'pm_company_id',
        'pm_client_id',
        'project_code',
        'project_name',
        'year',
        'status',
        'date_start',
        'date_end',
        'date_delivery',
        'client_contact_name',
        'client_contact_phone',
        'client_contact_email',
        'progress',
        'color',
        'total_before_ppn',
        'total_after_ppn',
        'uploaded_doc',
        'uploaded_timeline',
        'link_catalog',
        'desc',
        'creator',
        'created_at',
        'updated_at'
    ];

    /**
     * Dipanggil langsung oleh controller kamu:
     * return data siap pakai untuk promag.js (window.PROJECTS).
     */
    public function getAll(): array
    {
        $p = $this->db->table($this->table . ' p');

        // Label status
        $statusCase = "CASE p.status
                           WHEN '0' THEN 'New'
                           WHEN '1' THEN 'RnD'
                           WHEN '2' THEN 'Maintenance'
                           ELSE 'Unknown'
                       END";

        // Warna status (FIXED: sesuai permintaan)
        $statusColorCase = "CASE p.status
                               WHEN '0' THEN '#ff0000'   /* New */
                               WHEN '1' THEN '#0000ff'   /* RnD */
                               WHEN '2' THEN '#ffa100'   /* Maintenance */
                               ELSE '#9ca3af'            /* fallback */
                           END";

        // Ambil pimpro (prioritas as_pimpro='1', lalu yang paling awal dibuat)
        $pimproSub = "(SELECT u.fullname
                        FROM pm_project_user pu
                        JOIN users u ON u.id = pu.pm_user_id
                       WHERE pu.pm_project_id = p.id
                    ORDER BY (pu.as_pimpro = '1') DESC,
                             pu.created_at ASC,
                             u.fullname ASC
                       LIMIT 1)";

        $p->select("
            p.id,
            p.project_name,
            p.status,
            {$statusCase}       AS status_label,
            {$statusColorCase}  AS status_color,
            p.progress,
            p.date_end          AS due_date,

            c.abbr              AS company_abbr,
            c.color             AS company_color,

            cl.client_name      AS client_name,

            {$pimproSub}        AS pimpro_name
        ", false);

        $p->join('pm_company c', 'c.id = p.pm_company_id', 'left');
        $p->join('pm_client  cl', 'cl.id = p.pm_client_id',  'left');

        // urutkan: due date non-null dulu, paling dekat di atas
        $p->orderBy("CASE WHEN p.date_end IS NULL OR p.date_end='0000-00-00' THEN 1 ELSE 0 END", 'ASC')
            ->orderBy('p.date_end', 'ASC')
            ->orderBy('p.project_name', 'ASC');

        $rows = $p->get()->getResultArray();

        // mapping ke struktur yang dipakai promag.js
        $out = [];
        foreach ($rows as $r) {
            $out[] = [
                // status badge
                'status'           => $r['status_label'] ?? null,
                'status_color'     => $r['status_color'] ?? '#9ca3af',

                // tanggal (Due Date = date_end)
                'tanggal'          => $this->fmtDate($r['due_date'] ?? null),

                // judul
                'judul'            => $r['project_name'] ?? null,

                // badge kecil (nama client dari pm_client)
                'client_name'      => $r['client_name'] ?? null,               // dikirim eksplisit
                'lokasi'           => $r['client_name'] ?? null,               // fallback nggak perlu panjang
                'lokasi_color'     => $r['company_color'] ?? null,

                // pimpro
                'penanggung_jawab' => $r['pimpro_name'] ?? null,

                // badge kanan (company abbr)
                'perusahaan'       => $r['company_abbr'] ?? null,
                'perusahaan_color' => $r['company_color'] ?? null,

                // progress
                'progress'         => is_numeric($r['progress'] ?? null) ? (float)$r['progress'] : 0,
            ];
        }

        return $out;
    }

    /** Format Y-m-d -> "d M Y" (11 May 2024). Kosongkan jika null/invalid. */
    private function fmtDate(?string $date): string
    {
        if (!$date || $date === '0000-00-00') return '';
        $ts = strtotime($date);
        if ($ts === false) return '';
        return date('d M Y', $ts);
    }
}
