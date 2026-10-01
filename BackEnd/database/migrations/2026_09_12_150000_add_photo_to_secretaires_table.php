<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Photo de profil du secrétaire, sur le même principe que la photo
     * du médecin (table medecin) : le fichier est stocké dans
     * storage/app/public/secretaires.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('secretaires', 'photo')) {
            Schema::table('secretaires', function (Blueprint $table) {
                $table->string('photo')
                    ->nullable()
                    ->after('telephone');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('secretaires', 'photo')) {
            Schema::table('secretaires', function (Blueprint $table) {
                $table->dropColumn('photo');
            });
        }
    }
};
