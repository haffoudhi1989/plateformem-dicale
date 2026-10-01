<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  
    public function up()
{
    Schema::create('patients', function (Blueprint $table) {

        $table->id();

        $table->string('nom');
        $table->string('prenom');

        $table->date('date_naissance')->nullable();

        $table->enum('sexe', [
            'Homme',
            'Femme'
        ]);

        $table->string('telephone')
              ->unique();

        $table->string('email')
              ->unique()
              ->nullable();


        $table->string('adresse')
              ->nullable();


        // Informations médicales

        $table->string('groupe_sanguin')
              ->nullable();


        $table->text('allergies')
              ->nullable();


        $table->text('maladies_chroniques')
              ->nullable();


        $table->text('antecedents')
              ->nullable();


        $table->timestamps();

    });
}
};
