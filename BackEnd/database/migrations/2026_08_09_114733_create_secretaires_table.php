<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('secretaires', function (Blueprint $table) {
            $table->id();

            $table->foreignId('cabinet_id')
                ->nullable()
                ->constrained('cabinets')
                ->nullOnDelete();

            $table->string('prenom');

            $table->string('nom');

            $table->string('email')
                ->unique();

            $table->string('telephone')
                ->nullable();

            $table->string('password');

            $table->boolean('actif')
                ->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('secretaires');
    }
};