<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Créer la table des consultations vidéo.
     */
    public function up(): void
    {
        Schema::create('consultation_videos', function (Blueprint $table) {
            $table->id();

            // Rendez-vous concerné
            $table->foreignId('rendez_vous_id')
                ->constrained('rendez_vous')
                ->onDelete('cascade');

            // Informations Agora
            $table->string('channel_name')->nullable();

            // Suivi de l'appel
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();

            // Durée en secondes
            $table->unsignedInteger('duration')->default(0);

            // Statut de la consultation vidéo
            $table->string('status')->default('scheduled');

            $table->timestamps();

            // Un rendez-vous correspond à une consultation vidéo
            $table->unique('rendez_vous_id');
        });
    }

    /**
     * Supprimer la table.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultation_videos');
    }
};