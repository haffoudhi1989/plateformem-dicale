<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
{
    if (Schema::hasTable('horaires')) {
        Schema::table('horaires', function (Blueprint $table) {
            try {
                $table->dropForeign(['cabinet_id']);
            } catch (\Throwable $e) {
                // La clé étrangère n'existe pas
            }
        });
    }
}

    public function down(): void
    {
        Schema::table('horaires', function (Blueprint $table) {
            $table->foreign('cabinet_id')
                ->references('id')
                ->on('cabinets')
                ->onDelete('cascade');
        });
    }
};