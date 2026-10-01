<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('secretaires', function (Blueprint $table) {
            $table->foreignId('cabinet_id')
                ->nullable()
                ->after('id')
                ->constrained('cabinets')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('secretaires', function (Blueprint $table) {
            $table->dropForeign(['cabinet_id']);
            $table->dropColumn('cabinet_id');
        });
    }
};