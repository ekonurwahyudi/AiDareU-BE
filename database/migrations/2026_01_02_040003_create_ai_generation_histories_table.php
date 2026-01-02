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
        Schema::create('ai_generation_histories', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid_user'); // Changed from string to uuid for PostgreSQL compatibility
            $table->string('keterangan'); // Generated AI Logo / Generated AI Foto Produk
            $table->text('hasil_generated'); // URL or JSON data hasil AI
            $table->integer('coin_used')->default(2); // Coin yang digunakan untuk generate
            $table->timestamps();

            // Index
            $table->index('uuid_user');
            $table->index('created_at');

            // Foreign key
            $table->foreign('uuid_user')
                  ->references('uuid')
                  ->on('users')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_generation_histories');
    }
};
