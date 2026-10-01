<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // user_id existe déjà dans notifications.
    // La clé étrangère existe également.
    }

  public function down(): void
{
    // Ne rien supprimer :
    // user_id et sa clé étrangère existent déjà.
}
};