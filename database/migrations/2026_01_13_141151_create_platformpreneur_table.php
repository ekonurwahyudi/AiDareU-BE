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
        Schema::create('platformpreneur', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('no_kontrak')->unique();
            $table->string('judul');
            $table->string('username')->unique();
            $table->string('perusahaan');
            $table->string('file')->nullable();
            $table->string('nama');
            $table->string('email');
            $table->string('no_hp', 20);
            $table->string('lokasi');
            $table->string('logo')->nullable();
            $table->string('logo_footer')->nullable();
            $table->integer('coin_user')->default(0);
            $table->integer('kuota_user')->default(0);
            $table->string('domain')->unique();
            $table->date('tgl_mulai');
            $table->date('tgl_akhir');
            $table->timestamps();

            // Indexes
            $table->index('no_kontrak');
            $table->index('email');
            $table->index('domain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platformpreneur');
    }
};
