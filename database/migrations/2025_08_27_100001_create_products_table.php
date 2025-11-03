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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('uuid_store');
            $table->string('nama_produk', 255);
            $table->text('deskripsi')->nullable();
            $table->enum('jenis_produk', ['digital', 'fisik'])->default('digital');
            $table->string('url_produk')->nullable(); // Only for digital products
            $table->json('upload_gambar_produk')->nullable(); // Store up to 10 images
            $table->decimal('harga_produk', 15, 2);
            $table->decimal('harga_diskon', 15, 2)->nullable();
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->enum('status_produk', ['active', 'inactive', 'draft'])->default('draft');
            $table->string('slug')->unique();
            $table->integer('stock')->default(0); // For physical products
            $table->string('sku', 100)->unique()->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords')->nullable();
            $table->timestamps();
            
            // Foreign key constraint for store
            $table->foreign('uuid_store')->references('uuid')->on('stores')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};