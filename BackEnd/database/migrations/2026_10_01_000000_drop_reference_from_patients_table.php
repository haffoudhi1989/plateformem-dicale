<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Suppression de la référence du dossier patient (patients.reference).
     */
    public function up(): void
    {
        if (!Schema::hasColumn('patients', 'reference')) {
            return;
        }

        // L'index unique créé par la migration d'origine est retiré explicitement.
        // Si le nom d'index diffère, MySQL le supprimera de toute façon avec la colonne.
        try {
            Schema::table('patients', function (Blueprint $table) {
                $table->dropUnique('patients_reference_unique');
            });
        } catch (\Throwable $e) {
            // Index absent ou déjà supprimé : on continue.
        }

        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn('reference');
        });
    }

    /**
     * Rétablissement de la colonne et régénération des références (DOS-AAAA-0000).
     */
    public function down(): void
    {
        if (Schema::hasColumn('patients', 'reference')) {
            return;
        }

        Schema::table('patients', function (Blueprint $table) {
            $table->string('reference', 30)->nullable()->unique()->after('id');
        });

        foreach (DB::table('patients')->orderBy('id')->get() as $patient) {
            DB::table('patients')->where('id', $patient->id)->update([
                'reference' => 'DOS-' . now()->format('Y') . '-' . str_pad((string) $patient->id, 4, '0', STR_PAD_LEFT),
            ]);
        }
    }
};
