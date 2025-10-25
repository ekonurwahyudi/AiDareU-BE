<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            // Add new store_uuid column
            $table->uuid('store_uuid')->nullable()->after('uuid');
        });

        // Update store_uuid with corresponding uuid from stores table
        DB::statement('
            UPDATE bank_accounts ba 
            SET store_uuid = (
                SELECT s.uuid 
                FROM stores s 
                WHERE s.id::text = ba.store_id::text
            )
        ');

        Schema::table('bank_accounts', function (Blueprint $table) {
            // Make store_uuid required and add foreign key constraint
            $table->uuid('store_uuid')->nullable(false)->change();
            $table->foreign('store_uuid')->references('uuid')->on('stores')->onDelete('cascade');
            
            // Drop old foreign key and column
            $table->dropForeign(['store_id']);
            $table->dropIndex(['store_id']);
            $table->dropColumn('store_id');
            
            // Add new index
            $table->index('store_uuid');
            $table->index(['store_uuid', 'is_primary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            // Add back store_id column
            $table->unsignedBigInteger('store_id')->nullable()->after('uuid');
        });

        // Update store_id with corresponding id from stores table
        DB::statement('
            UPDATE bank_accounts ba 
            SET store_id = (
                SELECT s.id 
                FROM stores s 
                WHERE s.uuid = ba.store_uuid
            )
        ');

        Schema::table('bank_accounts', function (Blueprint $table) {
            // Make store_id required and add foreign key constraint
            $table->unsignedBigInteger('store_id')->nullable(false)->change();
            $table->foreign('store_id')->references('id')->on('stores')->onDelete('cascade');
            
            // Drop new foreign key and column
            $table->dropForeign(['store_uuid']);
            $table->dropIndex(['store_uuid']);
            $table->dropIndex(['store_uuid', 'is_primary']);
            $table->dropColumn('store_uuid');
            
            // Add back old indexes
            $table->index('store_id');
            $table->index(['store_id', 'is_primary']);
        });
    }
};
