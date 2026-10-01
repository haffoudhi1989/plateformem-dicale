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
    Schema::create('horaires', function (Blueprint $table) {

        $table->id();

        $table->foreignId('cabinet_id')
            ->constrained('cabinets')
            ->cascadeOnDelete();

        $table->enum('jour', [
            'lundi',
            'mardi',
            'mercredi',
            'jeudi',
            'vendredi',
            'samedi',
            'dimanche'
        ]);

        $table->time('heure_ouverture')->nullable();

        $table->time('heure_fermeture')->nullable();

        $table->boolean('actif')->default(true);

        $table->timestamps();

        $table->unique([
            'cabinet_id',
            'jour'
        ]);
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('horaires');
    }
};
