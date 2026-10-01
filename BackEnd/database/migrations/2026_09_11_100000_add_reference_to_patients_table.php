<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('patients', 'reference')) {
            Schema::table('patients', function (Blueprint $table) {
                // Référence du dossier patient, ex : DOS-2026-0004
                $table->string('reference', 30)->nullable()->unique()->after('id');
            });
        }

        // Reprise des dossiers existants
        foreach (DB::table('patients')->orderBy('id')->get() as $patient) {
            if (!empty($patient->reference)) {
                continue;
            }

            DB::table('patients')->where('id', $patient->id)->update([
                'reference' => 'DOS-' . now()->format('Y') . '-' . str_pad((string) $patient->id, 4, '0', STR_PAD_LEFT),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('patients', 'reference')) {
            Schema::table('patients', function (Blueprint $table) {
                $table->dropColumn('reference');
            });
        }
    }
};
