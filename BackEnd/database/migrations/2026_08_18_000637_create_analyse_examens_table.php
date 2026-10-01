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
        Schema::create('analyses_examens', function (Blueprint $table) {
            $table->id();

            $table->foreignId('patient_id')
                ->constrained('patients')
                ->onDelete('cascade');

            $table->foreignId('medecin_id')
                ->nullable()
                ->constrained('medecin')
                ->onDelete('set null');

            $table->string('type')->nullable();

            $table->string('nom');

            $table->date('date_examen')->nullable();

            $table->string('statut')
                ->default('En attente');

            $table->text('resultat')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analyses_examens');
    }
};