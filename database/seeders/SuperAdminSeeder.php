<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use App\Models\Store;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin User
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@aidaru.com'],
            [
                'name' => 'Super Administrator',
                'nama_lengkap' => 'Super Administrator',
                'no_hp' => '08123456789',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
                'alasan_gabung' => 'System Administrator',
                'info_dari' => 'lainnya',
                'is_active' => true,
            ]
        );

        // Assign Superadmin Role
        $superadminRole = Role::where('name', 'superadmin')->first();
        if ($superadminRole) {
            $superAdmin->assignRole($superadminRole);
        }

        // Create Sample Store Owner
        $storeOwner = User::updateOrCreate(
            ['email' => 'owner@example.com'],
            [
                'name' => 'Store Owner',
                'nama_lengkap' => 'Store Owner Example',
                'no_hp' => '08123456788',
                'password' => Hash::make('owner123'),
                'email_verified_at' => now(),
                'alasan_gabung' => 'Ingin membuat toko online',
                'info_dari' => 'google',
                'is_active' => true,
            ]
        );

        // Create Sample Store
        $store = Store::updateOrCreate(
            ['sub_domain' => 'contoh-toko'],
            [
                'nama_toko' => 'Contoh Toko Online',
                'sub_domain' => 'contoh-toko',
                'no_hp_toko' => '08123456787',
                'kategori_toko' => 'fashion',
                'deskripsi_toko' => 'Ini adalah contoh toko online untuk testing sistem. Menjual berbagai produk fashion terkini dengan kualitas terbaik.',
                'alamat' => 'Jl. Contoh No. 123, Jakarta',
                'owner_id' => $storeOwner->id,
                'user_id' => $storeOwner->uuid,
                'is_active' => true,
            ]
        );

        // Assign Owner Role to Store Owner
        $ownerRole = Role::where('name', 'owner')->first();
        if ($ownerRole) {
            $storeOwner->assignRole($ownerRole, $store->id);
        }

        // Create Sample Admin Toko
        $adminToko = User::updateOrCreate(
            ['email' => 'admin.toko@example.com'],
            [
                'name' => 'Admin Toko',
                'nama_lengkap' => 'Admin Toko Example',
                'no_hp' => '08123456786',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
                'alasan_gabung' => 'Bekerja sebagai admin toko',
                'info_dari' => 'teman_saudara',
                'is_active' => true,
            ]
        );

        // Assign Admin Toko Role
        $adminTokoRole = Role::where('name', 'admin_toko')->first();
        if ($adminTokoRole) {
            $adminToko->assignRole($adminTokoRole, $store->id);
        }

        $this->command->info('Sample users created:');
        $this->command->info('Super Admin: admin@aidaru.com / admin123');
        $this->command->info('Store Owner: owner@example.com / owner123');
        $this->command->info('Admin Toko: admin.toko@example.com / admin123');
        $this->command->info('Sample Store: contoh-toko.aidaru.com');
    }
}