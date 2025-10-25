<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create System Roles
        $superadmin = Role::updateOrCreate(
            ['name' => 'superadmin', 'guard_name' => 'web'],
            [
                'guard_name' => 'web',
                'display_name' => 'Super Administrator',
                'description' => 'Full system access with all permissions',
                'level' => 100,
                'is_system' => true,
            ]
        );

        $owner = Role::updateOrCreate(
            ['name' => 'owner', 'guard_name' => 'web'],
            [
                'guard_name' => 'web',
                'display_name' => 'Store Owner',
                'description' => 'Store owner with management privileges',
                'level' => 80,
                'is_system' => true,
            ]
        );

        $adminToko = Role::updateOrCreate(
            ['name' => 'admin_toko', 'guard_name' => 'web'],
            [
                'guard_name' => 'web',
                'display_name' => 'Admin Toko',
                'description' => 'Store admin with content management access',
                'level' => 60,
                'is_system' => true,
            ]
        );

        // Assign permissions to roles
        $this->assignPermissionsToRoles($superadmin, $owner, $adminToko);
    }

    private function assignPermissionsToRoles($superadmin, $owner, $adminToko)
    {
        // Superadmin gets all permissions
        $allPermissions = Permission::all();
        $superadmin->syncPermissions($allPermissions);

        // Owner permissions (store management)
        $ownerPermissions = Permission::whereIn('name', [
            // Users (within store context)
            'users.create',
            'users.read',
            'users.update',
            'users.delete',
            
            // Roles (assign to store users)
            'roles.read',
            'roles.assign',
            
            // Store management
            'stores.read',
            'stores.update',
            'stores.manage',
            
            // Products
            'products.create',
            'products.read',
            'products.update',
            'products.delete',
            
            // Orders
            'orders.create',
            'orders.read',
            'orders.update',
            'orders.delete',
            
            // Analytics
            'analytics.read',
            
            // Settings (store level)
            'settings.read',
            'settings.update',
            
            // Content
            'content.create',
            'content.read',
            'content.update',
            'content.delete',
        ])->get();

        $owner->syncPermissions($ownerPermissions);

        // Admin Toko permissions (content management only)
        $adminTokoPermissions = Permission::whereIn('name', [
            // Products (limited)
            'products.create',
            'products.read',
            'products.update',
            
            // Orders (view and update status)
            'orders.read',
            'orders.update',
            
            // Content management
            'content.create',
            'content.read',
            'content.update',
            'content.delete',
            
            // Basic settings
            'settings.read',
        ])->get();

        $adminToko->syncPermissions($adminTokoPermissions);
    }
}