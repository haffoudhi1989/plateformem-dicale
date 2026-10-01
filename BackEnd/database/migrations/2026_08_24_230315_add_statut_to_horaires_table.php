<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('horaires', function (Blueprint $table) {
    $table->enum('statut', [
        'en_attente',
        'valide',
        'refuse'
    ])->default('en_attente');
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('horaires', function (Blueprint $table) {
            //
        });
    }
};
