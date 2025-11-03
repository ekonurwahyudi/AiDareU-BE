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
        Schema::create('setting_toko', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('uuid_store');
            $table->string('logo')->nullable();
            $table->string('favicon')->nullable();
            $table->string('site_title')->nullable();
            $table->string('site_tagline')->nullable();
            $table->string('primary_color')->default('#0da487');
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('uuid_store')->references('uuid')->on('stores')->onDelete('cascade');

            // Ensure one setting per store
            $table->unique('uuid_store');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setting_toko');
    }
};
