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
        Schema::create('cabinets', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('adresse', 500)->nullable();
            $table->string('telephone', 50)->nullable();
            $table->string('email')->nullable();
            $table->text('description')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        
    
            $table->unsignedBigInteger('medecin_id')->nullable();
            $table->unsignedBigInteger('patient_id')->nullable();
            $table->unsignedBigInteger('secretaire_id')->nullable();
             $table->foreign('medecin_id')
                ->references('id')
                ->on('medecin')
                ->nullOnDelete();

            $table->foreign('patient_id')
                ->references('id')
                ->on('patients')
                ->nullOnDelete();

            $table->foreign('secretaire_id')
                ->references('id')
                ->on('secretaires')
                ->nullOnDelete();
        });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cabinets');
    }
};
