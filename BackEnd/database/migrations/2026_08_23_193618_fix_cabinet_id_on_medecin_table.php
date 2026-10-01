<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('medecin')) {
            return;
        }

        if (!Schema::hasColumn('medecin', 'cabinet_id')) {
            Schema::table('medecin', function (Blueprint $table) {
                $table->unsignedBigInteger('cabinet_id')
                    ->nullable()
                    ->after('id');
            });
        }

        /*
         * Supprimer les anciennes valeurs invalides.
         * Un cabinet_id doit obligatoirement correspondre
         * à un cabinet existant.
         */
        if (Schema::hasTable('cabinets')) {
            DB::statement("
                UPDATE medecin m
                LEFT JOIN cabinets c ON c.id = m.cabinet_id
                SET m.cabinet_id = NULL
                WHERE m.cabinet_id IS NOT NULL
                AND c.id IS NULL
            ");

            /*
             * Ajouter la clé étrangère.
             */
            $foreignExists = DB::select("
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'medecin'
                AND COLUMN_NAME = 'cabinet_id'
                AND REFERENCED_TABLE_NAME = 'cabinets'
            ");

            if (empty($foreignExists)) {
                Schema::table('medecin', function (Blueprint $table) {
                    $table->foreign('cabinet_id')
                        ->references('id')
                        ->on('cabinets')
                        ->nullOnDelete();
                });
            }
        }
    }

    public function down(): void
    {
        if (
            Schema::hasTable('medecin') &&
            Schema::hasColumn('medecin', 'cabinet_id')
        ) {
            Schema::table('medecin', function (Blueprint $table) {
                try {
                    $table->dropForeign(['cabinet_id']);
                } catch (\Throwable $e) {
                    // La clé étrangère n'existe pas.
                }
            });
        }
    }
};