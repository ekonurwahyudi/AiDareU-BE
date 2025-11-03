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
        // First drop the old custom RBAC tables
        // We'll keep the data in the seeder to recreate it

        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permissions'); 
        
        // Rename old tables to backup format
        if (Schema::hasTable('roles')) {
            Schema::rename('roles', 'roles_backup');
        }
        if (Schema::hasTable('permissions')) {
            Schema::rename('permissions', 'permissions_backup');
        }

        // Add additional fields to Spatie tables to maintain our custom fields
        // This will be done after Spatie migration runs
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore backup tables if needed
        if (Schema::hasTable('roles_backup')) {
            Schema::rename('roles_backup', 'roles');
        }
        if (Schema::hasTable('permissions_backup')) {
            Schema::rename('permissions_backup', 'permissions');
        }
    }
};