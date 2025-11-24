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
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite doesn't support modifying CHECK constraints directly
            // We need to recreate the table

            // Step 1: Create a temporary table with the new constraint
            DB::statement('CREATE TABLE products_temp AS SELECT * FROM products');

            // Step 2: Drop the old table
            Schema::dropIfExists('products');

            // Step 3: Recreate the table with new jenis_produk values
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->uuid('uuid_store');
                $table->string('nama_produk', 255);
                $table->text('deskripsi')->nullable();
                $table->string('jenis_produk')->default('digital'); // Changed from enum to string with check below
                $table->string('url_produk')->nullable();
                $table->json('upload_gambar_produk')->nullable();
                $table->decimal('harga_produk', 15, 2);
                $table->decimal('harga_diskon', 15, 2)->nullable();
                $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
                $table->string('status_produk')->default('draft'); // Changed from enum
                $table->string('slug')->unique();
                $table->integer('stock')->default(0);
                $table->string('sku', 100)->unique()->nullable();
                $table->text('meta_description')->nullable();
                $table->string('meta_keywords')->nullable();
                $table->timestamps();

                $table->foreign('uuid_store')->references('uuid')->on('stores')->onDelete('cascade');
            });

            // Add CHECK constraint for jenis_produk
            DB::statement("CREATE TRIGGER check_jenis_produk_insert BEFORE INSERT ON products
                WHEN NEW.jenis_produk NOT IN ('digital', 'fisik', 'affiliate', 'jasa')
                BEGIN
                    SELECT RAISE(ABORT, 'Invalid jenis_produk value');
                END");

            DB::statement("CREATE TRIGGER check_jenis_produk_update BEFORE UPDATE ON products
                WHEN NEW.jenis_produk NOT IN ('digital', 'fisik', 'affiliate', 'jasa')
                BEGIN
                    SELECT RAISE(ABORT, 'Invalid jenis_produk value');
                END");

            // Add CHECK constraint for status_produk
            DB::statement("CREATE TRIGGER check_status_produk_insert BEFORE INSERT ON products
                WHEN NEW.status_produk NOT IN ('active', 'inactive', 'draft')
                BEGIN
                    SELECT RAISE(ABORT, 'Invalid status_produk value');
                END");

            DB::statement("CREATE TRIGGER check_status_produk_update BEFORE UPDATE ON products
                WHEN NEW.status_produk NOT IN ('active', 'inactive', 'draft')
                BEGIN
                    SELECT RAISE(ABORT, 'Invalid status_produk value');
                END");

            // Step 4: Copy data back
            DB::statement('INSERT INTO products SELECT * FROM products_temp');

            // Step 5: Drop temporary table
            DB::statement('DROP TABLE products_temp');

        } elseif ($driver === 'pgsql') {
            // For PostgreSQL: Alter the column to change ENUM constraint
            DB::statement("ALTER TABLE products DROP CONSTRAINT IF EXISTS products_jenis_produk_check");
            DB::statement("ALTER TABLE products ADD CONSTRAINT products_jenis_produk_check CHECK (jenis_produk IN ('digital', 'fisik', 'affiliate', 'jasa'))");
        } else {
            // For MySQL: Modify the ENUM column
            DB::statement("ALTER TABLE products MODIFY COLUMN jenis_produk ENUM('digital', 'fisik', 'affiliate', 'jasa') NOT NULL DEFAULT 'digital'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            // For SQLite, we'd need to recreate the table again
            // This is complex and potentially destructive, so we'll skip it
            // In production with PostgreSQL, the down() will work properly
        } elseif ($driver === 'pgsql') {
            DB::statement("ALTER TABLE products DROP CONSTRAINT IF EXISTS products_jenis_produk_check");
            DB::statement("ALTER TABLE products ADD CONSTRAINT products_jenis_produk_check CHECK (jenis_produk IN ('digital', 'fisik'))");
        } else {
            // For MySQL
            DB::statement("ALTER TABLE products MODIFY COLUMN jenis_produk ENUM('digital', 'fisik') NOT NULL DEFAULT 'digital'");
        }
    }
};
