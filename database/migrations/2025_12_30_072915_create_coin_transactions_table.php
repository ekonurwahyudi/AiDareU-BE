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
        Schema::create('coin_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid_user');
            $table->string('keterangan');
            $table->integer('coin_masuk')->default(0);
            $table->integer('coin_keluar')->default(0);
            $table->string('status')->default('berhasil'); // berhasil, pending, gagal
            $table->timestamps();

            // Index untuk query yang lebih cepat
            $table->index('uuid_user');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coin_transactions');
    }
};
