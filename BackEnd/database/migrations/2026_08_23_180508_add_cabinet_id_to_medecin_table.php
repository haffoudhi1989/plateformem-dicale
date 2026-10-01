<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
    }

    public function down(): void
    {
        Schema::table('medecin', function (Blueprint $table) {
            $table->dropForeign(['cabinet_id']);
            $table->dropColumn('cabinet_id');
        });
    }
};