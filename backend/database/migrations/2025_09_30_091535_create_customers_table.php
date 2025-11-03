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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('nama');
            $table->string('no_hp', 20);
            $table->string('email')->nullable();
            $table->string('provinsi', 100);
            $table->string('kota', 100);
            $table->string('kecamatan', 100);
            $table->text('alamat');
            $table->uuid('uuid_store');
            $table->timestamps();

            // Foreign key
            $table->foreign('uuid_store')->references('uuid')->on('stores')->onDelete('cascade');

            // Indexes
            $table->index('uuid_store');
            $table->index('email');
            $table->index('no_hp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
