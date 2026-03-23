<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
      public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->id('venue_id'); 
            $table->string('name');
            $table->integer('capacity');
            $table->decimal('price_per_hour', 10, 2);
            $table->string('best_for')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};
