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
        // For PostgreSQL, we need to alter the enum type
        // First check if the value already exists
        $exists = DB::select("
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'umkdigital.id' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_info_dari')
        ");

        if (empty($exists)) {
            DB::statement("ALTER TYPE users_info_dari ADD VALUE IF NOT EXISTS 'umkdigital.id'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // PostgreSQL doesn't support removing enum values easily
        // This would require recreating the type and column
    }
};
