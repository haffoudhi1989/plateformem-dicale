<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Messagerie interne du personnel (médecin / secrétaire / admin).
     *
     * Les interlocuteurs appartiennent à des tables différentes
     * (users pour admin & cabinet, medecin pour les médecins,
     * secretaires pour les secrétaires) : on stocke donc le type
     * + l'id de chaque partie, SANS contrainte de clé étrangère.
     */
    public function up(): void
    {
        Schema::create('staff_messages', function (Blueprint $table) {
            $table->id();

            // Expéditeur : medecin | secretaire | admin
            $table->string('sender_type');
            $table->unsignedBigInteger('sender_id');

            // Destinataire : medecin | secretaire | admin
            $table->string('receiver_type');
            $table->unsignedBigInteger('receiver_id');

            $table->text('content');
            $table->boolean('is_read')->default(false);

            $table->timestamps();

            $table->index(['sender_type', 'sender_id']);
            $table->index(['receiver_type', 'receiver_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_messages');
    }
};
