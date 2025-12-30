<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\CoinTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CoinTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil user pertama atau user dengan email tertentu
        $user = User::first();

        if (!$user) {
            $this->command->error('No users found. Please create a user first.');

            return;
        }

        $this->command->info("Creating coin transactions for user: {$user->email}");

        // Data sample transaksi coin
        $transactions = [
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Order Cancel No. Order TLKM-030224038',
                'coin_masuk' => 0,
                'coin_keluar' => 2331000,
                'status' => 'berhasil',
                'created_at' => now()->subDays(18)->setTime(10, 32),
                'updated_at' => now()->subDays(18)->setTime(10, 32),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Order Cancel No. Order TLKM-040224044',
                'coin_masuk' => 0,
                'coin_keluar' => 2886000,
                'status' => 'berhasil',
                'created_at' => now()->subDays(18)->setTime(10, 22),
                'updated_at' => now()->subDays(18)->setTime(10, 22),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Order Cancel No. Order TLKM-291223003',
                'coin_masuk' => 0,
                'coin_keluar' => 271566,
                'status' => 'berhasil',
                'created_at' => now()->subDays(18)->setTime(9, 56),
                'updated_at' => now()->subDays(18)->setTime(9, 56),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Alat ukur Cancel No. Order TLKM-040224044 - SIGNAL GENERATOR FY6900',
                'coin_masuk' => 0,
                'coin_keluar' => 2600000,
                'status' => 'berhasil',
                'created_at' => now()->subDays(19)->setTime(16, 1),
                'updated_at' => now()->subDays(19)->setTime(16, 1),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Alat ukur Cancel No. Order TLKM-020124013 - BK Precision 2005B 450 MHz RF Signal Generator',
                'coin_masuk' => 0,
                'coin_keluar' => 343534,
                'status' => 'berhasil',
                'created_at' => now()->subDays(19)->setTime(14, 33),
                'updated_at' => now()->subDays(19)->setTime(14, 33),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Top Up Coin via Transfer Bank BCA',
                'coin_masuk' => 5000000,
                'coin_keluar' => 0,
                'status' => 'berhasil',
                'created_at' => now()->subDays(20)->setTime(11, 15),
                'updated_at' => now()->subDays(20)->setTime(11, 15),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Bonus Registrasi Member Baru',
                'coin_masuk' => 100000,
                'coin_keluar' => 0,
                'status' => 'berhasil',
                'created_at' => now()->subDays(25)->setTime(8, 30),
                'updated_at' => now()->subDays(25)->setTime(8, 30),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Pembelian Produk Digital - Template Website Premium',
                'coin_masuk' => 0,
                'coin_keluar' => 450000,
                'status' => 'berhasil',
                'created_at' => now()->subDays(15)->setTime(14, 20),
                'updated_at' => now()->subDays(15)->setTime(14, 20),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Komisi Penjualan Affiliate',
                'coin_masuk' => 125000,
                'coin_keluar' => 0,
                'status' => 'berhasil',
                'created_at' => now()->subDays(10)->setTime(9, 45),
                'updated_at' => now()->subDays(10)->setTime(9, 45),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Refund Order No. TLKM-050124075',
                'coin_masuk' => 1200000,
                'coin_keluar' => 0,
                'status' => 'berhasil',
                'created_at' => now()->subDays(7)->setTime(15, 10),
                'updated_at' => now()->subDays(7)->setTime(15, 10),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Subscription Premium Features - 1 Bulan',
                'coin_masuk' => 0,
                'coin_keluar' => 299000,
                'status' => 'berhasil',
                'created_at' => now()->subDays(5)->setTime(10, 30),
                'updated_at' => now()->subDays(5)->setTime(10, 30),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Top Up Coin via OVO',
                'coin_masuk' => 2000000,
                'coin_keluar' => 0,
                'status' => 'berhasil',
                'created_at' => now()->subDays(3)->setTime(13, 25),
                'updated_at' => now()->subDays(3)->setTime(13, 25),
            ],
            [
                'uuid_user' => $user->uuid,
                'keterangan' => 'Withdrawal ke Rekening Bank',
                'coin_masuk' => 0,
                'coin_keluar' => 1500000,
                'status' => 'pending',
                'created_at' => now()->subDays(1)->setTime(16, 45),
                'updated_at' => now()->subDays(1)->setTime(16, 45),
            ],
        ];

        // Insert ke database
        DB::table('coin_transactions')->insert($transactions);

        $this->command->info('Coin transactions seeded successfully!');
        $this->command->info('Total transactions created: ' . count($transactions));
    }
}
