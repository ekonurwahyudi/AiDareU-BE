<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nama_lengkap')->nullable()->after('name');
            $table->string('no_hp')->nullable()->after('email');
            $table->text('alasan_gabung')->nullable()->after('no_hp');
            $table->enum('info_dari', [
                'sosial_media', 
                'grup_komunitas', 
                'iklan', 
                'google', 
                'teman_saudara', 
                'lainnya'
            ])->nullable()->after('alasan_gabung');
            $table->string('avatar')->nullable()->after('info_dari');
            $table->boolean('is_active')->default(true)->after('avatar');
            $table->string('email_verification_code')->nullable()->after('email_verified_at');
            $table->timestamp('email_verification_code_expires_at')->nullable()->after('email_verification_code');
        });

        // Update existing users with default nama_lengkap
        \DB::table('users')
            ->whereNull('nama_lengkap')
            ->update(['nama_lengkap' => \DB::raw('name')]);

        // Now make nama_lengkap NOT NULL
        Schema::table('users', function (Blueprint $table) {
            $table->string('nama_lengkap')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'nama_lengkap',
                'no_hp',
                'alasan_gabung',
                'info_dari',
                'avatar',
                'is_active',
                'email_verification_code',
                'email_verification_code_expires_at'
            ]);
        });
    }
};