<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Users Management
            ['name' => 'users.create', 'display_name' => 'Create Users', 'description' => 'Create new users', 'module' => 'users', 'action' => 'create', 'resource' => 'users'],
            ['name' => 'users.read', 'display_name' => 'View Users', 'description' => 'View users list', 'module' => 'users', 'action' => 'read', 'resource' => 'users'],
            ['name' => 'users.update', 'display_name' => 'Update Users', 'description' => 'Update user information', 'module' => 'users', 'action' => 'update', 'resource' => 'users'],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'description' => 'Delete users', 'module' => 'users', 'action' => 'delete', 'resource' => 'users'],

            // Roles Management
            ['name' => 'roles.create', 'display_name' => 'Create Roles', 'description' => 'Create new roles', 'module' => 'roles', 'action' => 'create', 'resource' => 'roles'],
            ['name' => 'roles.read', 'display_name' => 'View Roles', 'description' => 'View roles list', 'module' => 'roles', 'action' => 'read', 'resource' => 'roles'],
            ['name' => 'roles.update', 'display_name' => 'Update Roles', 'description' => 'Update role information', 'module' => 'roles', 'action' => 'update', 'resource' => 'roles'],
            ['name' => 'roles.delete', 'display_name' => 'Delete Roles', 'description' => 'Delete roles', 'module' => 'roles', 'action' => 'delete', 'resource' => 'roles'],
            ['name' => 'roles.assign', 'display_name' => 'Assign Roles', 'description' => 'Assign roles to users', 'module' => 'roles', 'action' => 'assign', 'resource' => 'roles'],

            // Permissions Management
            ['name' => 'permissions.read', 'display_name' => 'View Permissions', 'description' => 'View permissions list', 'module' => 'permissions', 'action' => 'read', 'resource' => 'permissions'],
            ['name' => 'permissions.update', 'display_name' => 'Update Permissions', 'description' => 'Update role permissions', 'module' => 'permissions', 'action' => 'update', 'resource' => 'permissions'],

            // Stores Management
            ['name' => 'stores.create', 'display_name' => 'Create Stores', 'description' => 'Create new stores', 'module' => 'stores', 'action' => 'create', 'resource' => 'stores'],
            ['name' => 'stores.read', 'display_name' => 'View Stores', 'description' => 'View stores list', 'module' => 'stores', 'action' => 'read', 'resource' => 'stores'],
            ['name' => 'stores.update', 'display_name' => 'Update Stores', 'description' => 'Update store information', 'module' => 'stores', 'action' => 'update', 'resource' => 'stores'],
            ['name' => 'stores.delete', 'display_name' => 'Delete Stores', 'description' => 'Delete stores', 'module' => 'stores', 'action' => 'delete', 'resource' => 'stores'],
            ['name' => 'stores.manage', 'display_name' => 'Manage Stores', 'description' => 'Full store management', 'module' => 'stores', 'action' => 'manage', 'resource' => 'stores'],

            // Products Management
            ['name' => 'products.create', 'display_name' => 'Create Products', 'description' => 'Create new products', 'module' => 'products', 'action' => 'create', 'resource' => 'products'],
            ['name' => 'products.read', 'display_name' => 'View Products', 'description' => 'View products list', 'module' => 'products', 'action' => 'read', 'resource' => 'products'],
            ['name' => 'products.update', 'display_name' => 'Update Products', 'description' => 'Update product information', 'module' => 'products', 'action' => 'update', 'resource' => 'products'],
            ['name' => 'products.delete', 'display_name' => 'Delete Products', 'description' => 'Delete products', 'module' => 'products', 'action' => 'delete', 'resource' => 'products'],

            // Orders Management
            ['name' => 'orders.create', 'display_name' => 'Create Orders', 'description' => 'Create new orders', 'module' => 'orders', 'action' => 'create', 'resource' => 'orders'],
            ['name' => 'orders.read', 'display_name' => 'View Orders', 'description' => 'View orders list', 'module' => 'orders', 'action' => 'read', 'resource' => 'orders'],
            ['name' => 'orders.update', 'display_name' => 'Update Orders', 'description' => 'Update order status', 'module' => 'orders', 'action' => 'update', 'resource' => 'orders'],
            ['name' => 'orders.delete', 'display_name' => 'Delete Orders', 'description' => 'Delete orders', 'module' => 'orders', 'action' => 'delete', 'resource' => 'orders'],

            // Analytics
            ['name' => 'analytics.read', 'display_name' => 'View Analytics', 'description' => 'View analytics and reports', 'module' => 'analytics', 'action' => 'read', 'resource' => 'analytics'],

            // Settings Management
            ['name' => 'settings.read', 'display_name' => 'View Settings', 'description' => 'View system settings', 'module' => 'settings', 'action' => 'read', 'resource' => 'settings'],
            ['name' => 'settings.update', 'display_name' => 'Update Settings', 'description' => 'Update system settings', 'module' => 'settings', 'action' => 'update', 'resource' => 'settings'],

            // Content Management
            ['name' => 'content.create', 'display_name' => 'Create Content', 'description' => 'Create store content', 'module' => 'content', 'action' => 'create', 'resource' => 'content'],
            ['name' => 'content.read', 'display_name' => 'View Content', 'description' => 'View store content', 'module' => 'content', 'action' => 'read', 'resource' => 'content'],
            ['name' => 'content.update', 'display_name' => 'Update Content', 'description' => 'Update store content', 'module' => 'content', 'action' => 'update', 'resource' => 'content'],
            ['name' => 'content.delete', 'display_name' => 'Delete Content', 'description' => 'Delete store content', 'module' => 'content', 'action' => 'delete', 'resource' => 'content'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['name' => $permission['name'], 'guard_name' => 'web'],
                array_merge($permission, ['guard_name' => 'web', 'is_system' => true])
            );
        }
    }
}