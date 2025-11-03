<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            // Add new fields as nullable first
            $table->uuid('uuid')->nullable()->after('id');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade')->after('uuid');
            $table->string('subdomain')->nullable()->after('user_id');
            $table->string('custom_domain')->nullable()->after('subdomain');
            $table->json('theme_settings')->nullable()->after('settings');
            $table->timestamp('verified_at')->nullable()->after('theme_settings');
        });

        // Generate UUIDs for existing records using Laravel's UUID generator
        $stores = DB::table('stores')->whereNull('uuid')->get();
        foreach ($stores as $store) {
            DB::table('stores')
                ->where('id', $store->id)
                ->update(['uuid' => Str::uuid()]);
        }
        
        // Copy owner_id to user_id for existing records
        DB::statement('UPDATE stores SET user_id = owner_id WHERE user_id IS NULL');
        
        // Copy sub_domain to subdomain for existing records
        DB::statement('UPDATE stores SET subdomain = sub_domain WHERE subdomain IS NULL');
        
        // Copy domain to custom_domain for existing records
        DB::statement('UPDATE stores SET custom_domain = domain WHERE custom_domain IS NULL AND domain IS NOT NULL');

        Schema::table('stores', function (Blueprint $table) {
            // Make uuid unique after populating data
            $table->unique('uuid');
            $table->unique('subdomain');
            $table->unique('custom_domain');
            
            // Add indexes
            $table->index(['user_id', 'is_active']);
            $table->index('subdomain');
            $table->index('custom_domain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_active']);
            $table->dropIndex(['subdomain']);
            $table->dropIndex(['custom_domain']);
            
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'uuid',
                'user_id',
                'subdomain',
                'custom_domain',
                'theme_settings',
                'verified_at'
            ]);
        });
    }
};