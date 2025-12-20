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
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('product_uuid');
            $table->string('variant_name'); // Contoh: "Warna", "Ukuran"
            $table->timestamps();

            // Foreign key
            $table->foreign('product_uuid')
                  ->references('uuid')
                  ->on('products')
                  ->onDelete('cascade');

            // Index untuk performa query
            $table->index('product_uuid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
