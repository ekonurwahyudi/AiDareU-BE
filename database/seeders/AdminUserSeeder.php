<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@vuexy.com'],
            [
                'name' => 'Admin',
                'nama_lengkap' => 'Administrator Vuexy',
                'no_hp' => '08123456780',
                'password' => Hash::make('admin'),
                'email_verified_at' => now(),
                'alasan_gabung' => 'Admin system',
                'info_dari' => 'lainnya',
                'is_active' => true,
            ]
        );
    }
}