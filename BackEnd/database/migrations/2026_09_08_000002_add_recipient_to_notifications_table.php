<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Destinataire des notifications in-app (patient / médecin).
     */
    public function up(): void
    {
        if (!Schema::hasColumn('notifications', 'recipient_type')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->string('recipient_type')->nullable()->after('id');
            });
        }

        if (!Schema::hasColumn('notifications', 'recipient_id')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->unsignedBigInteger('recipient_id')->nullable()->after('recipient_type');
            });
        }
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['recipient_type', 'recipient_id']);
        });
    }
};
