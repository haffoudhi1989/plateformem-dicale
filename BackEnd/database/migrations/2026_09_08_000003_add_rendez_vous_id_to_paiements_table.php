<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Ajoute la colonne rendez_vous_id à la table paiements.
 *
 * La migration initiale (2026_08_07_231451) la déclarait déjà mais n'a jamais
 * été appliquée avec cette colonne sur certaines bases existantes (colonne
 * absente => SQLSTATE 42S22). On l'ajoute ici en NULLABLE afin de préserver
 * les paiements déjà enregistrés sans rendez-vous.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            if (!Schema::hasColumn('paiements', 'rendez_vous_id')) {
                $table->foreignId('rendez_vous_id')
                      ->nullable()
                      ->after('patient_id')
                      ->constrained('rendez_vous')
                      ->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            if (Schema::hasColumn('paiements', 'rendez_vous_id')) {
                $table->dropConstrainedForeignId('rendez_vous_id');
            }
        });
    }
};
