<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Store;
use Spatie\Permission\Models\Role;

class SpatieUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample users and assign Spatie roles
        
        // Create or update Super Admin
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@aidaru.com'],
            [
                'name' => 'Super Admin',
                'nama_lengkap' => 'Super Administrator AiDareU',
                'password' => bcrypt('admin123'),
                'no_hp' => '+62812345678901',
                'alasan_gabung' => 'System Administrator',
                'info_dari' => 'lainnya',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        
        // Remove existing roles and assign new role
        $superAdmin->syncRoles(['superadmin']);

        // Create or find sample store first
        $sampleStore = Store::firstOrCreate(
            ['subdomain' => 'contoh-toko'],
            [
                'nama_toko' => 'Contoh Toko AiDareU',
                'domain' => 'contoh-toko.aidaru.com',
                'no_hp_toko' => '+62812345678900',
                'kategori_toko' => 'fashion',
                'deskripsi_toko' => 'Contoh toko untuk testing sistem AiDareU dengan berbagai produk fashion berkualitas.',
                'alamat' => 'Jl. Contoh No. 123, Jakarta',
                'is_active' => true,
                'user_id' => 0, // Will be updated
            ]
        );

        // Create Store Owner
        $storeOwner = User::firstOrCreate(
            ['email' => 'owner@example.com'],
            [
                'name' => 'John Owner',
                'nama_lengkap' => 'John Store Owner',
                'password' => bcrypt('owner123'),
                'no_hp' => '+62812345678902',
                'alasan_gabung' => 'Ingin membuka toko online',
                'info_dari' => 'sosial_media',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $storeOwner->syncRoles(['owner']);

        // Update store user_id
        $sampleStore->update(['user_id' => $storeOwner->id]);

        // Create Admin Toko
        $adminToko = User::firstOrCreate(
            ['email' => 'admin.toko@example.com'],
            [
                'name' => 'Jane Admin',
                'nama_lengkap' => 'Jane Admin Toko',
                'password' => bcrypt('admin123'),
                'no_hp' => '+62812345678903',
                'alasan_gabung' => 'Bekerja sebagai admin toko',
                'info_dari' => 'teman_saudara',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $adminToko->syncRoles(['admin_toko']);

        // Note: Store-specific roles will be handled later via the UI or API
        // For now, users have global roles assigned via syncRoles() above

        $this->command->info('Sample users created:');
        $this->command->info('Super Admin: admin@aidaru.com / admin123');
        $this->command->info('Store Owner: owner@example.com / owner123');
        $this->command->info('Admin Toko: admin.toko@example.com / admin123');
        $this->command->info('Sample Store: contoh-toko.aidaru.com');
    }
}