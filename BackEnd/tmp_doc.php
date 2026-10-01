<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

echo "== USERS role medecin ==\n";
foreach (\App\Models\User::where('role', 'medecin')->orderBy('id')->get() as $u) {
    echo $u->id, ' | ', $u->name, ' | ', $u->email, ' | medecin_id=', (int) $u->medecin_id, "\n";
}

echo "== MEDECINS nom/email/cabinet ==\n";
foreach (\App\Models\Medecin::orderBy('id')->get() as $m) {
    echo $m->id, ' | ', trim($m->prenom . ' ' . $m->nom), ' | ', $m->email, ' | cab=', (int) $m->cabinet_id, "\n";
}

// Rattachement cible : le medecin lie au compte user "Ben salah" s'il existe
$target = null;

foreach (\App\Models\User::where('role', 'medecin')->get() as $u) {
    $isBenSalah = stripos($u->name, 'ben salah') !== false || stripos($u->email, 'bensalah') !== false;
    if (!$isBenSalah) continue;

    if (!empty($u->medecin_id)) {
        $target = \App\Models\Medecin::find($u->medecin_id);
    }
    if (!$target) {
        $target = \App\Models\Medecin::where('email', $u->email)->orderBy('id')->first();
    }
    if ($target) break;
}

if (!$target) {
    $target = \App\Models\Medecin::whereNull('cabinet_id')->orderBy('id')->first();
}

if ($target) {
    DB::beginTransaction();
    try {
        $det = \App\Models\Medecin::where('cabinet_id', 15)
            ->where('id', '!=', $target->id)
            ->update(['cabinet_id' => null]);
        $target->update(['cabinet_id' => 15]);
        DB::commit();
        echo 'BOUND medecin=', $target->id, ' ', trim($target->prenom . ' ' . $target->nom),
            ' ', $target->email, ' -> cabinet 15 (detached=', (int) $det, ")\n";
    } catch (\Throwable $e) {
        DB::rollBack();
        echo 'ERR ', $e->getMessage(), "\n";
    }
} else {
    echo "NO_TARGET\n";
}
