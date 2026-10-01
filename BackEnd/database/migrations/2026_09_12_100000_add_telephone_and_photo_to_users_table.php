<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Coordonnées du compte (téléphone) et photo de profil de l'utilisateur.
     * Utilisé par l'espace admin : menu « Paramètres ».
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {

            if (!Schema::hasColumn('users', 'telephone')) {
                $table->string('telephone', 30)
                    ->nullable()
                    ->after('email');
            }

            if (!Schema::hasColumn('users', 'photo')) {
                $table->string('photo')
                    ->nullable()
                    ->after('telephone');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {

            if (Schema::hasColumn('users', 'telephone')) {
                $table->dropColumn('telephone');
            }

            if (Schema::hasColumn('users', 'photo')) {
                $table->dropColumn('photo');
            }
        });
    }
};
