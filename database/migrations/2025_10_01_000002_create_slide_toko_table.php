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
        Schema::create('slide_toko', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('uuid_store');
            $table->string('slide_1')->nullable();
            $table->string('slide_2')->nullable();
            $table->string('slide_3')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('uuid_store')->references('uuid')->on('stores')->onDelete('cascade');

            // Ensure one slide setting per store
            $table->unique('uuid_store');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('slide_toko');
    }
};
