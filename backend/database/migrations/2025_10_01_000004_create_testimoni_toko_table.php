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
        Schema::create('testimoni_toko', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('uuid_store');
            $table->string('nama');
            $table->text('testimoni');
            $table->integer('rating')->default(5); // 1-5 stars
            $table->string('lokasi')->nullable();
            $table->string('paket')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('uuid_store')->references('uuid')->on('stores')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimoni_toko');
    }
};
