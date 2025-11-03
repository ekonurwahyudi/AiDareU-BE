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
        // First ensure we have the owner role
        $ownerRole = DB::table('roles')->where('name', 'owner')->first();
        
        if (!$ownerRole) {
            // Create owner role if it doesn't exist
            $ownerRoleId = DB::table('roles')->insertGetId([
                'name' => 'owner',
                'guard_name' => 'web',
                'display_name' => 'Store Owner',
                'description' => 'Default role for store owners',
                'level' => 2,
                'is_system' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $ownerRoleId = $ownerRole->id;
        }
        
        // Get all users that don't have any roles assigned
        $usersWithoutRoles = DB::table('users as u')
            ->leftJoin('model_has_roles as mhr', function($join) {
                $join->on('u.id', '=', 'mhr.model_id')
                     ->where('mhr.model_type', '=', 'App\\Models\\User');
            })
            ->whereNull('mhr.role_id')
            ->select('u.id', 'u.uuid', 'u.name')
            ->get();
            
        // Assign owner role to all users without roles
        foreach ($usersWithoutRoles as $user) {
            DB::table('model_has_roles')->insert([
                'role_id' => $ownerRoleId,
                'model_type' => 'App\\Models\\User',
                'model_id' => $user->id,
                'store_id' => null, // Global role, not store-specific
            ]);
            
            echo "Assigned 'owner' role to user: {$user->name} (UUID: {$user->uuid})\n";
        }
        
        echo "Total users assigned owner role: " . count($usersWithoutRoles) . "\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove owner role assignments that were created by this migration
        // Only remove if user has no other roles except owner
        $ownerRole = DB::table('roles')->where('name', 'owner')->first();
        
        if ($ownerRole) {
            // Find users who only have owner role
            $userIdsWithOnlyOwnerRole = DB::table('model_has_roles')
                ->select('model_id')
                ->where('model_type', 'App\\Models\\User')
                ->groupBy('model_id')
                ->havingRaw('COUNT(role_id) = 1')
                ->whereExists(function($query) use ($ownerRole) {
                    $query->select(DB::raw(1))
                          ->from('model_has_roles as mhr2')
                          ->whereRaw('mhr2.model_id = model_has_roles.model_id')
                          ->where('mhr2.role_id', $ownerRole->id);
                })
                ->pluck('model_id');
                
            // Remove owner role from these users
            DB::table('model_has_roles')
                ->where('role_id', $ownerRole->id)
                ->where('model_type', 'App\\Models\\User')
                ->whereIn('model_id', $userIdsWithOnlyOwnerRole)
                ->delete();
                
            echo "Removed owner role from " . count($userIdsWithOnlyOwnerRole) . " users\n";
        }
    }
};
