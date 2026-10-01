
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {

            $table->id();

            // Patient
            $table->foreignId('patient_id')
                  ->constrained('patients')
                  ->cascadeOnDelete();

            // Rendez-vous
            $table->foreignId('rendez_vous_id')
                  ->nullable()
                  ->constrained('rendez_vous')
                  ->cascadeOnDelete();

            // Montant
            $table->decimal('montant', 10, 2);

            // Mode de paiement
            $table->string('mode_paiement')->nullable();

            // Statut
            $table->string('statut')->default('En attente');

            // Date du paiement
            $table->date('date_paiement')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};

