<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Abonnement du cabinet (plan, période, statut).
     */
    public function up(): void
    {
        Schema::table('cabinets', function (Blueprint $table) {
            $table->string('plan', 20)->default('Basic')->after('actif');
            $table->date('date_debut_abonnement')->nullable()->after('plan');
            $table->date('date_fin_abonnement')->nullable()->after('date_debut_abonnement');
            $table->string('statut_abonnement', 20)->default('actif')->after('date_fin_abonnement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cabinets', function (Blueprint $table) {
            $table->dropColumn(['plan', 'date_debut_abonnement', 'date_fin_abonnement', 'statut_abonnement']);
        });
    }
};
