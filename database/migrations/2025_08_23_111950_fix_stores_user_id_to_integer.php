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
        // Clear existing stores data to avoid type mismatch issues
        DB::statement("TRUNCATE TABLE stores RESTART IDENTITY CASCADE");
        
        // Drop ALL foreign key constraints first
        DB::statement("
            DO \$\$ 
            DECLARE 
                r RECORD;
            BEGIN
                FOR r IN (SELECT constraint_name FROM information_schema.table_constraints 
                         WHERE table_name = 'stores' AND constraint_type = 'FOREIGN KEY')
                LOOP
                    EXECUTE 'ALTER TABLE stores DROP CONSTRAINT ' || r.constraint_name;
                END LOOP;
            END \$\$;
        ");
        
        // Use raw SQL to change column type directly
        DB::statement("ALTER TABLE stores ALTER COLUMN user_id TYPE BIGINT USING user_id::text::bigint");
        
        Schema::table('stores', function (Blueprint $table) {
            // Add foreign key constraint
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            // Drop the integer foreign key
            $table->dropForeign(['user_id']);
            
            // Change user_id back to UUID
            $table->uuid('user_id')->change();
            
            // Recreate foreign key to users.uuid
            $table->foreign('user_id')->references('uuid')->on('users')->onDelete('cascade');
        });
    }
};
