<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cabinet_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cabinet_id')->constrained('cabinets')->onDelete('cascade');
            $table->string('nom');
            $table->string('email');
            $table->string('sujet');
            $table->text('message');
            $table->boolean('lu')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cabinet_messages');
    }
};
