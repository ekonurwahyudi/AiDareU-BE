<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Sync helpdesk_uuid in helpdesk_details table from helpdesks table
     */
    public function up(): void
    {
        // Update helpdesk_details to have correct helpdesk_uuid based on helpdesk_id
        DB::statement('
            UPDATE helpdesk_details 
            SET helpdesk_uuid = helpdesks.uuid
            FROM helpdesks 
            WHERE helpdesk_details.helpdesk_id = helpdesks.id
            AND (helpdesk_details.helpdesk_uuid IS NULL OR helpdesk_details.helpdesk_uuid != helpdesks.uuid)
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reverse
    }
};
