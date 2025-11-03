<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $categories = [
            [
                'judul_kategori' => 'Elektronik',
                'deskripsi_kategori' => 'Produk elektronik seperti laptop, smartphone, dan gadget lainnya',
                'is_active' => true,
            ],
            [
                'judul_kategori' => 'Fashion',
                'deskripsi_kategori' => 'Pakaian, sepatu, dan aksesoris fashion',
                'is_active' => true,
            ],
            [
                'judul_kategori' => 'Makanan & Minuman',
                'deskripsi_kategori' => 'Produk makanan, minuman, dan snack',
                'is_active' => true,
            ],
            [
                'judul_kategori' => 'Kesehatan & Kecantikan',
                'deskripsi_kategori' => 'Produk kesehatan, kecantikan, dan perawatan tubuh',
                'is_active' => true,
            ],
            [
                'judul_kategori' => 'Rumah & Taman',
                'deskripsi_kategori' => 'Peralatan rumah tangga dan perlengkapan taman',
                'is_active' => true,
            ],
            [
                'judul_kategori' => 'Olahraga',
                'deskripsi_kategori' => 'Peralatan olahraga dan fitness',
                'is_active' => true,
            ],
            [
                'judul_kategori' => 'Otomotif',
                'deskripsi_kategori' => 'Aksesoris dan spare part kendaraan',
                'is_active' => true,
            ],
            [
                'judul_kategori' => 'Buku & Media',
                'deskripsi_kategori' => 'Buku, majalah, dan produk media lainnya',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}