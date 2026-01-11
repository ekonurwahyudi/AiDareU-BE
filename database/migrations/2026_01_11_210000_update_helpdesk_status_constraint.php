<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Update the status check constraint to only allow: open, in_progress, closed
     */
    public function up(): void
    {
        // Drop old constraint
        DB::statement('ALTER TABLE helpdesks DROP CONSTRAINT IF EXISTS helpdesks_status_check');
        
        // First, update any old status values to new ones
        DB::table('helpdesks')
            ->whereIn('status', ['replied', 'waiting_reply'])
            ->update(['status' => 'in_progress']);
        
        // Add new constraint with only 3 status values
        DB::statement("ALTER TABLE helpdesks ADD CONSTRAINT helpdesks_status_check CHECK (status IN ('open', 'in_progress', 'closed'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop new constraint
        DB::statement('ALTER TABLE helpdesks DROP CONSTRAINT IF EXISTS helpdesks_status_check');
        
        // Restore old constraint
        DB::statement("ALTER TABLE helpdesks ADD CONSTRAINT helpdesks_status_check CHECK (status IN ('open', 'waiting_reply', 'replied', 'closed'))");
    }
};
