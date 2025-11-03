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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('uuid_store');
            $table->uuid('uuid_customer');
            $table->string('nomor_order')->unique();
            $table->string('voucher')->nullable();
            $table->decimal('total_harga', 15, 2);
            $table->string('ekspedisi');
            $table->string('estimasi_tiba')->nullable();
            $table->string('status')->default('pending');
            $table->uuid('uuid_bank_account');
            $table->timestamps();

            // Foreign keys
            $table->foreign('uuid_store')->references('uuid')->on('stores')->onDelete('cascade');
            $table->foreign('uuid_customer')->references('uuid')->on('customers')->onDelete('cascade');
            $table->foreign('uuid_bank_account')->references('uuid')->on('bank_accounts');

            // Indexes
            $table->index('uuid_store');
            $table->index('uuid_customer');
            $table->index('nomor_order');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
