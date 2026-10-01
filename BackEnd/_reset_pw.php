<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Secretaire;
use Illuminate\Support\Facades\Hash;

$s = Secretaire::where('email', 'amira.trabelsi@gmail.com')->first();
if ($s) { $s->password = Hash::make('Test1234!'); $s->save(); echo "SECRETAIRE_OK" . PHP_EOL; }

$m = User::where('email', 'ahmed.bensalah@gmail.com')->first();
if ($m) { $m->password = Hash::make('Test1234!'); $m->save(); echo "MEDECIN_OK" . PHP_EOL; }

$p = User::where('email', 'sami.trabelsi@gmail.com')->first();
if ($p) { $p->password = Hash::make('Test1234!'); $p->save(); echo "PATIENT_OK" . PHP_EOL; }
