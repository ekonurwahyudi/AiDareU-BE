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
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->string('nama_toko');
            $table->string('sub_domain')->unique();
            $table->string('domain')->nullable()->unique();
            $table->string('no_hp_toko');
            $table->enum('kategori_toko', [
                'fashion',
                'elektronik', 
                'makanan',
                'kesehatan',
                'rumah_tangga',
                'olahraga',
                'buku_media',
                'otomotif',
                'mainan_hobi',
                'jasa',
                'lainnya'
            ]);
            $table->text('deskripsi_toko');
            $table->string('logo')->nullable();
            $table->string('banner')->nullable();
            $table->text('alamat')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->json('settings')->nullable();
            $table->timestamps();
            
            $table->index('sub_domain');
            $table->index('owner_id');
            $table->index('kategori_toko');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};