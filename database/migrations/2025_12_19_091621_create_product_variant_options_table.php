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
        Schema::create('product_variant_options', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('variant_uuid');
            $table->string('option_name'); // Contoh: "Merah", "L", "XL"
            $table->decimal('harga', 15, 2)->nullable(); // Harga khusus untuk opsi ini
            $table->integer('stock')->default(0); // Stok khusus untuk opsi ini
            $table->string('sku')->nullable(); // SKU khusus untuk varian (optional)
            $table->timestamps();

            // Foreign key
            $table->foreign('variant_uuid')
                  ->references('uuid')
                  ->on('product_variants')
                  ->onDelete('cascade');

            // Index untuk performa query
            $table->index('variant_uuid');
            $table->index('sku');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variant_options');
    }
};
