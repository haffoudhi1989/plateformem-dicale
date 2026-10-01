<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'secretaire_medecin',
            function (Blueprint $table) {

                $table->id();

                $table->foreignId(
                    'secretaire_id'
                )
                    ->constrained(
                        'secretaires'
                    )
                    ->cascadeOnDelete();

                $table->foreignId(
                    'medecin_id'
                )
                    ->constrained(
                        'medecins'
                    )
                    ->cascadeOnDelete();

                $table->timestamps();

                $table->unique([
                    'secretaire_id',
                    'medecin_id'
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'secretaire_medecin'
        );
    }
};