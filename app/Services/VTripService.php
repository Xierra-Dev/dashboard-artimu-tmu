<?php
// app/Services/VTripService.php
namespace App\Services;

use App\Models\VTripModel;
use CodeIgniter\HTTP\IncomingRequest; // ⬅️ ganti ini

class VTripService
{
    /**
     * Ambil rows berdasar query string (?at=... | ?start=...&end=...)
     * Presisi MENIT (tanpa detik).
     */
    public function rowsFromRequest(IncomingRequest $request): array // ⬅️ type IncomingRequest
    {
        $model = new VTripModel();

        [$start, $end, $at] = $this->parseQuery($request);

        if ($start && $end) {
            return $model->getIntersectingMinute($start, $end);
        }
        if ($at) {
            return $model->getOngoingMinute($at);
        }
        return $model->getOngoingMinute();
    }

    /** === Helpers private === */
    private function parseQuery(IncomingRequest $request): array // ⬅️ type IncomingRequest
    {
        $atRaw    = $request->getGet('at');
        $startRaw = $request->getGet('start');
        $endRaw   = $request->getGet('end');

        $at    = $this->toMinute($atRaw);
        $start = $this->toMinute($startRaw, '00:00');
        $end   = $this->toMinute($endRaw,   '23:59');

        return [$start, $end, $at];
    }

    /**
     * Normalisasi ke 'Y-m-d H:i' (atau null).
     * $defaultTime dipakai jika input hanya tanggal.
     */
    private function toMinute(?string $input, ?string $defaultTime = null): ?string
    {   //                  ^^^^^^^ ⬅️ jadikan nullable agar tidak ada warning
        $s = trim((string) $input);
        if ($s === '') return null;

        $formats = [
            'Y-m-d H:i',
            'Y-m-d\TH:i',   // dari input type="datetime-local"
            'Y-m-d',
            'd/m/Y H:i',
            'd/m/Y',
            'd-m-Y H:i',
            'd-m-Y',
        ];

        foreach ($formats as $fmt) {
            $dt = \DateTime::createFromFormat($fmt, $s);
            if ($dt !== false) {
                if (strpos($fmt, 'H:i') === false) {
                    $time = $defaultTime ?? '00:00';
                    return $dt->format('Y-m-d') . ' ' . $time;
                }
                return $dt->format('Y-m-d H:i');
            }
        }
        return null;
    }
}
