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
        Schema::create('duitku_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('merchant_order_id', 100)->unique();
            $table->string('reference', 100)->nullable();
            $table->string('payment_method', 10);
            $table->integer('coin_amount');
            $table->integer('payment_amount');
            $table->enum('status', ['pending', 'success', 'failed', 'expired'])->default('pending');
            $table->string('result_code', 10)->nullable();
            $table->string('payment_code', 50)->nullable();
            $table->text('payment_url')->nullable();
            $table->string('va_number', 50)->nullable();
            $table->text('qr_string')->nullable();
            $table->string('callback_reference', 100)->nullable();
            $table->timestamp('settlement_date')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('merchant_order_id');
            $table->index('reference');
            $table->index('status');
            $table->index('created_at');

            // Foreign key
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('duitku_transactions');
    }
};
