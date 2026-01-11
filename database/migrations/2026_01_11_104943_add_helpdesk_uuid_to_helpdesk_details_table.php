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
        Schema::table('helpdesk_details', function (Blueprint $table) {
            $table->uuid('helpdesk_uuid')->nullable()->after('helpdesk_id');
            $table->index('helpdesk_uuid');
        });

        // Update existing records to populate helpdesk_uuid from helpdesks table (PostgreSQL compatible)
        DB::statement('
            UPDATE helpdesk_details 
            SET helpdesk_uuid = helpdesks.uuid
            FROM helpdesks 
            WHERE helpdesk_details.helpdesk_id = helpdesks.id
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('helpdesk_details', function (Blueprint $table) {
            $table->dropIndex(['helpdesk_uuid']);
            $table->dropColumn('helpdesk_uuid');
        });
    }
};
