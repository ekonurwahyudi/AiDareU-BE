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
        Schema::create('pixel_stores', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('store_uuid');
            $table->string('pixel_type'); // facebook, tiktok, google_tag_manager
            $table->string('pixel_id')->nullable();
            $table->text('convention_event')->nullable(); // Event codes or conversion settings
            $table->string('test_code')->nullable(); // Testing code
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->foreign('store_uuid')->references('uuid')->on('stores')->onDelete('cascade');
            $table->index(['store_uuid', 'pixel_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pixel_stores');
    }
};
