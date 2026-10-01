<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rattache les patients orphelins au cabinet du médecin qui les suit.
     *
     * Le cabinet est déduit du rendez-vous le plus récent du patient. Cette
     * migration reprend explicitement en base ce que l'ancienne clause « OR »
     * de CabinetController affichait de façon implicite : depuis le passage à
     * la règle stricte (patients.cabinet_id uniquement), ces patients
     * n'apparaissaient plus dans les cabinets.
     *
     * Seuls les patients dont cabinet_id est NULL sont concernés : aucune
     * affectation existante n'est écrasée.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('patients', 'cabinet_id')) {
            return;
        }

        $patients = DB::table('patients')
            ->whereNull('cabinet_id')
            ->orderBy('id')
            ->get();

        foreach ($patients as $patient) {
            $cabinetId = DB::table('rendez_vous')
                ->join('medecin', 'medecin.id', '=', 'rendez_vous.medecin_id')
                ->where('rendez_vous.patient_id', $patient->id)
                ->whereNotNull('medecin.cabinet_id')
                ->orderByDesc('rendez_vous.date_rdv')
                ->orderByDesc('rendez_vous.id')
                ->value('medecin.cabinet_id');

            if (!$cabinetId) {
                continue;
            }

            DB::table('patients')
                ->where('id', $patient->id)
                ->update(['cabinet_id' => $cabinetId]);
        }
    }

    /**
     * Irréversible : on ne peut pas savoir a posteriori quels patients étaient
     * orphelins avant cette migration. Une sauvegarde de l'état initial a été
     * écrite dans temp/backup_patients_cabinet_20261001.json.
     */
    public function down(): void
    {
        // Volontairement vide.
    }
};
