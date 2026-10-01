<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            Schema::hasColumn('notifications', 'patient_id') &&
            !Schema::hasColumn('notifications', 'user_id')
        ) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->renameColumn('patient_id', 'user_id');
            });
        }
    }

    public function down(): void
    {
        if (
            Schema::hasColumn('notifications', 'user_id') &&
            !Schema::hasColumn('notifications', 'patient_id')
        ) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->renameColumn('user_id', 'patient_id');
            });
        }
    }
};