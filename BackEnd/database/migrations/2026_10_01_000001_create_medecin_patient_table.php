<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Relation plusieurs-à-plusieurs entre les patients et les médecins.
     *
     * Un patient peut désormais être suivi par plusieurs médecins, et un
     * médecin peut suivre plusieurs patients. Attention : la table des
     * médecins s'appelle « medecin » (au singulier) dans ce projet.
     */
    public function up(): void
    {
        if (!Schema::hasTable('medecin_patient')) {
            Schema::create('medecin_patient', function (Blueprint $table) {
                $table->id();

                $table->foreignId('patient_id')
                    ->constrained('patients')
                    ->cascadeOnDelete();

                $table->foreignId('medecin_id')
                    ->constrained('medecin')
                    ->cascadeOnDelete();

                $table->timestamps();

                $table->unique(['patient_id', 'medecin_id']);
            });
        }

        // Reprise des relations déjà existantes : un patient ayant eu un
        // rendez-vous avec un médecin est considéré comme suivi par lui.
        $maintenant = now();

        $liens = DB::table('rendez_vous')
            ->select('patient_id', 'medecin_id')
            ->whereNotNull('patient_id')
            ->whereNotNull('medecin_id')
            ->distinct()
            ->get();

        foreach ($liens as $lien) {
            DB::table('medecin_patient')->updateOrInsert(
                [
                    'patient_id' => $lien->patient_id,
                    'medecin_id' => $lien->medecin_id,
                ],
                [
                    'created_at' => $maintenant,
                    'updated_at' => $maintenant,
                ]
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('medecin_patient');
    }
};
