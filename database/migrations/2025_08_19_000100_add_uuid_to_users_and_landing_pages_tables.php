<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // users: tambahkan kolom uuid
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'uuid')) {
                $table->uuid('uuid')->nullable()->unique()->after('id');
            }
        });

        // landing_pages: tambahkan kolom uuid
        Schema::table('landing_pages', function (Blueprint $table) {
            if (!Schema::hasColumn('landing_pages', 'uuid')) {
                $table->uuid('uuid')->nullable()->unique()->after('id');
            }
        });

        // Isi uuid untuk data lama (users)
        $users = DB::table('users')->whereNull('uuid')->pluck('id');
        foreach ($users as $id) {
            DB::table('users')->where('id', $id)->update(['uuid' => (string) \Illuminate\Support\Str::uuid()]);
        }

        // Isi uuid untuk data lama (landing_pages)
        if (Schema::hasTable('landing_pages')) {
            $landings = DB::table('landing_pages')->whereNull('uuid')->pluck('id');
            foreach ($landings as $id) {
                DB::table('landing_pages')->where('id', $id)->update(['uuid' => (string) \Illuminate\Support\Str::uuid()]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'uuid')) {
                $table->dropUnique(['uuid']);
                $table->dropColumn('uuid');
            }
        });

        Schema::table('landing_pages', function (Blueprint $table) {
            if (Schema::hasColumn('landing_pages', 'uuid')) {
                $table->dropUnique(['uuid']);
                $table->dropColumn('uuid');
            }
        });
    }
};