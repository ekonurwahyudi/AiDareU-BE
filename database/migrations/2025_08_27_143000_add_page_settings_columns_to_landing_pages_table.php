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
            // Store relationship
            $table->uuid('store_uuid')->nullable()->after('user_id')->comment('UUID of the associated store');
            
            // Page basic information
            $table->string('nama_halaman')->nullable()->after('slug')->comment('Page name/title');
            
            // Media files
            $table->string('favicon')->nullable()->after('nama_halaman')->comment('Favicon file path');
            $table->string('logo')->nullable()->after('favicon')->comment('Logo file path');
            
            // Domain settings
            $table->string('subdomain')->nullable()->after('logo')->comment('Subdomain for the landing page');
            $table->string('domain')->nullable()->after('subdomain')->comment('Custom domain for the landing page');
            
            // SEO settings
            $table->text('meta_description')->nullable()->after('domain')->comment('Meta description for SEO');
            $table->text('keywords')->nullable()->after('meta_description')->comment('Website keywords for SEO');
            
            // Tracking pixels (from UI form)
            $table->uuid('facebook_pixel_uuid')->nullable()->after('keywords')->comment('Facebook Pixel UUID');
            $table->uuid('tiktok_pixel_uuid')->nullable()->after('facebook_pixel_uuid')->comment('TikTok Pixel UUID');
            $table->uuid('google_tag_manager_uuid')->nullable()->after('tiktok_pixel_uuid')->comment('Google Tag Manager UUID');
            
            // Add indexes for performance
            $table->index('store_uuid');
            $table->index('subdomain');
            $table->index('domain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('landing_pages', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['store_uuid']);
            $table->dropIndex(['subdomain']);
            $table->dropIndex(['domain']);
            
            // Drop columns
            $table->dropColumn([
                'store_uuid',
                'nama_halaman',
                'favicon',
                'logo',
                'subdomain',
                'domain',
                'meta_description',
                'keywords',
                'facebook_pixel_uuid',
                'tiktok_pixel_uuid',
                'google_tag_manager_uuid'
            ]);
        });
    }
};