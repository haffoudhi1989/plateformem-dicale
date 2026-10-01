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
        Schema::create('cabinet_abonnements', function (Blueprint $table) {
            $table->id();

            // Cabinet lié
            $table->foreignId('cabinet_id')
                  ->constrained('cabinets')
                  ->cascadeOnDelete();

            // Plan souscrit : Basic, Pro, Premium
            $table->string('plan', 50)->default('Basic');

            // Montant total réglé ou à régler
            $table->decimal('montant', 10, 2)->default(0.00);

            // Durée de l'abonnement en mois (ex: 1, 3, 6, 12)
            $table->unsignedInteger('duree_mois')->default(1);

            // Période de validité
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();

            // Mode de paiement : Virement bancaire, Carte bancaire, Chèque, Espèces, En ligne
            $table->string('mode_paiement', 100)->default('Virement bancaire');

            // Statut du paiement : 'Payé', 'En attente', 'Expiré', 'Annulé'
            $table->string('statut', 50)->default('Payé');

            // Date d'encaissement / paiement effectif
            $table->date('date_paiement')->nullable();

            // Référence de transaction ou de virement / chèque
            $table->string('reference', 100)->nullable();

            // Notes / Commentaires éventuels
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cabinet_abonnements');
    }
};
