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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('uuid_store');
            $table->string('kode_voucher');
            $table->text('keterangan');
            $table->integer('kuota')->default(0);
            $table->integer('kuota_terpakai')->default(0);
            $table->date('tgl_mulai');
            $table->date('tgl_berakhir');
            $table->enum('status', ['active', 'inactive', 'expired'])->default('active');
            $table->enum('jenis_voucher', ['ongkir', 'potongan_harga']);
            $table->decimal('nilai_diskon', 15, 2)->default(0);
            $table->decimal('minimum_pembelian', 15, 2)->nullable();
            $table->decimal('maksimal_diskon', 15, 2)->nullable();
            $table->timestamps();

            // Indexes
            $table->index('uuid_store');
            $table->index('kode_voucher');
            $table->index('status');
            $table->unique(['uuid_store', 'kode_voucher']);

            // Foreign key
            $table->foreign('uuid_store')->references('uuid')->on('stores')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
