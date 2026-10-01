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
        Schema::table('Cabinets', function (Blueprint $table) {
       // $table->foreignId('secretaire_id' )->constrained('secretaires')
          //          ->cascadeOnDelete();

        // $table->foreignId('patient_id' )->constrained('patients')
              //      ->cascadeOnDelete();
            //
           //$table->foreignId('medecin_id' )->constrained('medecin')
                 //   ->cascadeOnDelete();

              
                $table->unique([
                    'secretaire_id',
                    'patient_id',
                    'medecin_id'
                ]);
    }
  );
}
    /**
     * Reverse the migrations.
     */
    public function down(): void{
    Schema::table('Cabinets', function (Blueprint $table) {

            $table->dropForeign(['secretaire_id']);
            $table->dropForeign(['patient_id']);
            $table->dropForeign(['medecin_id']);

            $table->dropUnique([
                'secretaire_id',
                'patient_id',
                'medecin_id',
            ]);

            $table->dropColumn([
                'secretaire_id',
                'patient_id',
                'medecin_id',
                'created_at',
                'updated_at',
            ]);
        });
    }
};
