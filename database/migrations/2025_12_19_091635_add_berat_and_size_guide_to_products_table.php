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
        Schema::table('products', function (Blueprint $table) {
            // Tambah kolom berat produk (dalam gram)
            $table->integer('berat_produk')->default(1000)->after('harga_diskon')->comment('Berat dalam gram');

            // Tambah kolom gambar panduan ukuran
            $table->string('size_guide_image')->nullable()->after('berat_produk')->comment('Path gambar panduan ukuran');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['berat_produk', 'size_guide_image']);
        });
    }
};
