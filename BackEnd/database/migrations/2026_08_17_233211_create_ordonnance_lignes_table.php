<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ordonnance_lignes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ordonnance_id')
                ->constrained('ordonnances')
                ->cascadeOnDelete();

            $table->string('medicament');

            $table->string('dosage')->nullable();

            $table->string('frequence')->nullable();

            $table->string('duree')->nullable();

            $table->string('quantite')->nullable();

            $table->text('instructions')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ordonnance_lignes');
    }
};