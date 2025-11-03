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
        Schema::table('landing_pages', function (Blueprint $table) {
            // SEO enhancements
            $table->string('title_tag')->nullable()->after('nama_halaman')->comment('Page title tag for SEO');
            $table->string('meta_image')->nullable()->after('keywords')->comment('Meta image for social media sharing');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('landing_pages', function (Blueprint $table) {
            $table->dropColumn([
                'title_tag',
                'meta_image'
            ]);
        });
    }
};