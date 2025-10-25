<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SpatiePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions with our custom fields
        $permissions = [
            // Users Management
            ['name' => 'users.read', 'display_name' => 'View Users', 'description' => 'Can view users list and details', 'module' => 'users', 'action' => 'read', 'resource' => 'users', 'is_system' => true],
            ['name' => 'users.create', 'display_name' => 'Create Users', 'description' => 'Can create new users', 'module' => 'users', 'action' => 'create', 'resource' => 'users', 'is_system' => true],
            ['name' => 'users.update', 'display_name' => 'Update Users', 'description' => 'Can update user information', 'module' => 'users', 'action' => 'update', 'resource' => 'users', 'is_system' => true],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'description' => 'Can delete users', 'module' => 'users', 'action' => 'delete', 'resource' => 'users', 'is_system' => true],
            ['name' => 'users.manage', 'display_name' => 'Manage Users', 'description' => 'Full user management access', 'module' => 'users', 'action' => 'manage', 'resource' => 'users', 'is_system' => true],
            ['name' => 'users.assign_roles', 'display_name' => 'Assign User Roles', 'description' => 'Can assign roles to users', 'module' => 'users', 'action' => 'assign', 'resource' => 'user_roles', 'is_system' => true],

            // Roles Management
            ['name' => 'roles.read', 'display_name' => 'View Roles', 'description' => 'Can view roles list and details', 'module' => 'roles', 'action' => 'read', 'resource' => 'roles', 'is_system' => true],
            ['name' => 'roles.create', 'display_name' => 'Create Roles', 'description' => 'Can create new roles', 'module' => 'roles', 'action' => 'create', 'resource' => 'roles', 'is_system' => true],
            ['name' => 'roles.update', 'display_name' => 'Update Roles', 'description' => 'Can update role information', 'module' => 'roles', 'action' => 'update', 'resource' => 'roles', 'is_system' => true],
            ['name' => 'roles.delete', 'display_name' => 'Delete Roles', 'description' => 'Can delete roles', 'module' => 'roles', 'action' => 'delete', 'resource' => 'roles', 'is_system' => true],
            ['name' => 'roles.manage', 'display_name' => 'Manage Roles', 'description' => 'Full role management access', 'module' => 'roles', 'action' => 'manage', 'resource' => 'roles', 'is_system' => true],
            ['name' => 'roles.assign_permissions', 'display_name' => 'Assign Role Permissions', 'description' => 'Can assign permissions to roles', 'module' => 'roles', 'action' => 'assign', 'resource' => 'role_permissions', 'is_system' => true],

            // Permissions Management
            ['name' => 'permissions.read', 'display_name' => 'View Permissions', 'description' => 'Can view permissions list', 'module' => 'permissions', 'action' => 'read', 'resource' => 'permissions', 'is_system' => true],
            ['name' => 'permissions.create', 'display_name' => 'Create Permissions', 'description' => 'Can create new permissions', 'module' => 'permissions', 'action' => 'create', 'resource' => 'permissions', 'is_system' => true],
            ['name' => 'permissions.update', 'display_name' => 'Update Permissions', 'description' => 'Can update permission information', 'module' => 'permissions', 'action' => 'update', 'resource' => 'permissions', 'is_system' => true],
            ['name' => 'permissions.delete', 'display_name' => 'Delete Permissions', 'description' => 'Can delete permissions', 'module' => 'permissions', 'action' => 'delete', 'resource' => 'permissions', 'is_system' => true],
            ['name' => 'permissions.manage', 'display_name' => 'Manage Permissions', 'description' => 'Full permission management access', 'module' => 'permissions', 'action' => 'manage', 'resource' => 'permissions', 'is_system' => true],

            // Stores Management
            ['name' => 'stores.read', 'display_name' => 'View Stores', 'description' => 'Can view stores list and details', 'module' => 'stores', 'action' => 'read', 'resource' => 'stores', 'is_system' => true],
            ['name' => 'stores.create', 'display_name' => 'Create Stores', 'description' => 'Can create new stores', 'module' => 'stores', 'action' => 'create', 'resource' => 'stores', 'is_system' => true],
            ['name' => 'stores.update', 'display_name' => 'Update Stores', 'description' => 'Can update store information', 'module' => 'stores', 'action' => 'update', 'resource' => 'stores', 'is_system' => true],
            ['name' => 'stores.delete', 'display_name' => 'Delete Stores', 'description' => 'Can delete stores', 'module' => 'stores', 'action' => 'delete', 'resource' => 'stores', 'is_system' => true],
            ['name' => 'stores.manage', 'display_name' => 'Manage Stores', 'description' => 'Full store management access', 'module' => 'stores', 'action' => 'manage', 'resource' => 'stores', 'is_system' => true],

            // Products Management
            ['name' => 'products.read', 'display_name' => 'View Products', 'description' => 'Can view products list and details', 'module' => 'products', 'action' => 'read', 'resource' => 'products', 'is_system' => true],
            ['name' => 'products.create', 'display_name' => 'Create Products', 'description' => 'Can create new products', 'module' => 'products', 'action' => 'create', 'resource' => 'products', 'is_system' => true],
            ['name' => 'products.update', 'display_name' => 'Update Products', 'description' => 'Can update product information', 'module' => 'products', 'action' => 'update', 'resource' => 'products', 'is_system' => true],
            ['name' => 'products.delete', 'display_name' => 'Delete Products', 'description' => 'Can delete products', 'module' => 'products', 'action' => 'delete', 'resource' => 'products', 'is_system' => true],
            ['name' => 'products.manage', 'display_name' => 'Manage Products', 'description' => 'Full product management access', 'module' => 'products', 'action' => 'manage', 'resource' => 'products', 'is_system' => true],

            // Orders Management
            ['name' => 'orders.read', 'display_name' => 'View Orders', 'description' => 'Can view orders list and details', 'module' => 'orders', 'action' => 'read', 'resource' => 'orders', 'is_system' => true],
            ['name' => 'orders.create', 'display_name' => 'Create Orders', 'description' => 'Can create new orders', 'module' => 'orders', 'action' => 'create', 'resource' => 'orders', 'is_system' => true],
            ['name' => 'orders.update', 'display_name' => 'Update Orders', 'description' => 'Can update order information', 'module' => 'orders', 'action' => 'update', 'resource' => 'orders', 'is_system' => true],
            ['name' => 'orders.delete', 'display_name' => 'Delete Orders', 'description' => 'Can delete orders', 'module' => 'orders', 'action' => 'delete', 'resource' => 'orders', 'is_system' => true],
            ['name' => 'orders.manage', 'display_name' => 'Manage Orders', 'description' => 'Full order management access', 'module' => 'orders', 'action' => 'manage', 'resource' => 'orders', 'is_system' => true],

            // Analytics
            ['name' => 'analytics.read', 'display_name' => 'View Analytics', 'description' => 'Can view analytics and reports', 'module' => 'analytics', 'action' => 'read', 'resource' => 'analytics', 'is_system' => true],
            ['name' => 'analytics.manage', 'display_name' => 'Manage Analytics', 'description' => 'Full analytics access', 'module' => 'analytics', 'action' => 'manage', 'resource' => 'analytics', 'is_system' => true],

            // Settings
            ['name' => 'settings.read', 'display_name' => 'View Settings', 'description' => 'Can view system settings', 'module' => 'settings', 'action' => 'read', 'resource' => 'settings', 'is_system' => true],
            ['name' => 'settings.update', 'display_name' => 'Update Settings', 'description' => 'Can update system settings', 'module' => 'settings', 'action' => 'update', 'resource' => 'settings', 'is_system' => true],
            ['name' => 'settings.manage', 'display_name' => 'Manage Settings', 'description' => 'Full settings management access', 'module' => 'settings', 'action' => 'manage', 'resource' => 'settings', 'is_system' => true],

            // Content Management
            ['name' => 'content.read', 'display_name' => 'View Content', 'description' => 'Can view content', 'module' => 'content', 'action' => 'read', 'resource' => 'content', 'is_system' => true],
            ['name' => 'content.create', 'display_name' => 'Create Content', 'description' => 'Can create new content', 'module' => 'content', 'action' => 'create', 'resource' => 'content', 'is_system' => true],
            ['name' => 'content.update', 'display_name' => 'Update Content', 'description' => 'Can update content', 'module' => 'content', 'action' => 'update', 'resource' => 'content', 'is_system' => true],
            ['name' => 'content.delete', 'display_name' => 'Delete Content', 'description' => 'Can delete content', 'module' => 'content', 'action' => 'delete', 'resource' => 'content', 'is_system' => true],
            ['name' => 'content.manage', 'display_name' => 'Manage Content', 'description' => 'Full content management access', 'module' => 'content', 'action' => 'manage', 'resource' => 'content', 'is_system' => true],
        ];

        foreach ($permissions as $permissionData) {
            Permission::create($permissionData);
        }

        // Create roles with our custom fields
        $superadminRole = Role::create([
            'name' => 'superadmin',
            'display_name' => 'Super Administrator',
            'description' => 'Full system access with all permissions',
            'level' => 10,
            'is_system' => true,
            'guard_name' => 'web'
        ]);

        $ownerRole = Role::create([
            'name' => 'owner',
            'display_name' => 'Store Owner',
            'description' => 'Store owner with full store management access',
            'level' => 5,
            'is_system' => true,
            'guard_name' => 'web'
        ]);

        $adminTokoRole = Role::create([
            'name' => 'admin_toko',
            'display_name' => 'Admin Toko',
            'description' => 'Store administrator with limited access',
            'level' => 3,
            'is_system' => true,
            'guard_name' => 'web'
        ]);

        // Assign permissions to roles
        // Superadmin gets all permissions
        $superadminRole->givePermissionTo(Permission::all());

        // Owner gets store-related permissions
        $ownerPermissions = Permission::whereIn('module', [
            'stores', 'products', 'orders', 'analytics', 'content'
        ])->get();
        $ownerRole->givePermissionTo($ownerPermissions);

        // Admin Toko gets limited permissions
        $adminTokoPermissions = Permission::whereIn('name', [
            'products.read', 'products.create', 'products.update',
            'orders.read', 'orders.create', 'orders.update',
            'content.read', 'content.create', 'content.update',
            'analytics.read'
        ])->get();
        $adminTokoRole->givePermissionTo($adminTokoPermissions);

        $this->command->info('Spatie permissions and roles created successfully!');
    }
}