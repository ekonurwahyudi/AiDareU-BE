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
        Schema::create('detail_orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('uuid_order');
            $table->uuid('uuid_product');
            $table->integer('quantity')->default(1);
            $table->decimal('price', 15, 2);
            $table->timestamps();

            // Foreign keys
            $table->foreign('uuid_order')->references('uuid')->on('orders')->onDelete('cascade');
            $table->foreign('uuid_product')->references('uuid')->on('products');

            // Indexes
            $table->index('uuid_order');
            $table->index('uuid_product');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_orders');
    }
};
