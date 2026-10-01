<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Si la table n'existe pas du tout, on la crée
        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
                $table->string('type')->nullable();
                $table->text('data')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        } 
        // 2. Si elle existe déjà mais sans la colonne user_id, on l'ajoute
        elseif (!Schema::hasColumn('notifications', 'user_id')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};