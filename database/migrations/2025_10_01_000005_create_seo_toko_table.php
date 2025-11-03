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
        Schema::create('seo_toko', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('uuid_store');
            $table->string('meta_title')->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('keyword')->nullable();
            $table->string('og_title')->nullable();
            $table->text('og_deskripsi')->nullable();
            $table->string('og_image')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('uuid_store')->references('uuid')->on('stores')->onDelete('cascade');

            // Ensure one SEO setting per store
            $table->unique('uuid_store');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seo_toko');
    }
};
