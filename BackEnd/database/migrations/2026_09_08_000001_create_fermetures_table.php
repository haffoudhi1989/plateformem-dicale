<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fermetures', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('cabinet_id')->index();
            $table->string('type', 30); // jour_ferie | absence_medecin | absence_patient

            $table->date('date_debut');
            $table->date('date_fin')->nullable();

            $table->unsignedBigInteger('medecin_id')->nullable()->index();
            $table->unsignedBigInteger('patient_id')->nullable()->index();

            $table->string('motif')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fermetures');
    }
};
