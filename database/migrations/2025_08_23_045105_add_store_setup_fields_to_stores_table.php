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
        Schema::table('stores', function (Blueprint $table) {
            // Bank Account Info
            $table->string('bank_account_owner')->nullable();
            $table->string('bank_account_number', 25)->nullable();
            $table->string('bank_name')->nullable();
            
            // Social Media URLs
            $table->string('instagram_url')->nullable();
            $table->string('facebook_url')->nullable();
            $table->string('tiktok_url')->nullable();
            $table->string('youtube_url')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn([
                'bank_account_owner',
                'bank_account_number',
                'bank_name',
                'instagram_url',
                'facebook_url',
                'tiktok_url',
                'youtube_url'
            ]);
        });
    }
};
