<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute la clé étrangère manquante sur patients.cabinet_id.
     *
     * C'était la SEULE colonne cabinet_id sans contrainte (medecin,
     * secretaires, users, horaires, cabinet_messages et cabinet_abonnements en
     * ont une). Sans elle, supprimer un cabinet laissait des références
     * orphelines : c'est ce qui s'est produit avec les patients #41, #43 et #44
     * (rattachés au cabinet 18) et #42 (cabinet 21), tous deux supprimés.
     *
     * Règle de suppression identique aux autres tables de membres :
     * ON DELETE SET NULL — supprimer un cabinet détache ses patients au lieu
     * de les supprimer.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('patients', 'cabinet_id')) {
            return;
        }

        /*
         * Nettoyage préalable : les références vers un cabinet inexistant
         * doivent disparaître, sinon la création de la clé échoue.
         */
        DB::table('patients')
            ->whereNotNull('cabinet_id')
            ->whereNotIn('cabinet_id', function ($query) {
                $query->select('id')->from('cabinets');
            })
            ->update(['cabinet_id' => null]);

        if ($this->contrainteExiste()) {
            return;
        }

        Schema::table('patients', function (Blueprint $table) {
            $table->foreign('cabinet_id')
                ->references('id')
                ->on('cabinets')
                ->nullOnDelete();
        });
    }

    /**
     * Retire la clé étrangère. Les cabinet_id restent en place.
     */
    public function down(): void
    {
        if (!$this->contrainteExiste()) {
            return;
        }

        Schema::table('patients', function (Blueprint $table) {
            $table->dropForeign(['cabinet_id']);
        });
    }

    /**
     * Indique si une clé étrangère existe déjà sur patients.cabinet_id.
     */
    private function contrainteExiste(): bool
    {
        return (bool) DB::selectOne(
            "SELECT CONSTRAINT_NAME
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'patients'
               AND COLUMN_NAME = 'cabinet_id'
               AND REFERENCED_TABLE_NAME IS NOT NULL"
        );
    }
};
