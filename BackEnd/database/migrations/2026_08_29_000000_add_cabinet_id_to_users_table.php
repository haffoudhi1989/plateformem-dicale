<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lien entre un compte utilisateur (rôle cabinet) et un cabinet médical.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('cabinet_id')->nullable()->after('is_active');

            $table->foreign('cabinet_id')
                ->references('id')
                ->on('cabinets')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['cabinet_id']);
            $table->dropColumn('cabinet_id');
        });
    }
};
