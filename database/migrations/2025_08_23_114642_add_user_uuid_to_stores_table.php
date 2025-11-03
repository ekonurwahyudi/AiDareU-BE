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
        // Step 1: Add new user_uuid column
        Schema::table('stores', function (Blueprint $table) {
            $table->uuid('user_uuid')->nullable()->after('user_id');
        });

        // Step 2: Populate user_uuid with corresponding UUIDs from users table
        DB::statement('
            UPDATE stores 
            SET user_uuid = (
                SELECT u.uuid 
                FROM users u 
                WHERE u.id = stores.user_id
            )
        ');

        // Step 3: Make user_uuid not nullable and add foreign key
        Schema::table('stores', function (Blueprint $table) {
            $table->uuid('user_uuid')->nullable(false)->change();
            $table->foreign('user_uuid')->references('uuid')->on('users')->onDelete('cascade');
        });

        // Step 4: Drop old foreign key and column
        Schema::table('stores', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });

        // Step 5: Rename user_uuid to user_id
        Schema::table('stores', function (Blueprint $table) {
            $table->renameColumn('user_uuid', 'user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Step 1: Rename user_id back to user_uuid
        Schema::table('stores', function (Blueprint $table) {
            $table->renameColumn('user_id', 'user_uuid');
        });

        // Step 2: Add back integer user_id column
        Schema::table('stores', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('uuid');
        });

        // Step 3: Populate user_id with corresponding integer IDs from users table
        DB::statement('
            UPDATE stores 
            SET user_id = (
                SELECT u.id 
                FROM users u 
                WHERE u.uuid = stores.user_uuid
            )
        ');

        // Step 4: Make user_id not nullable and add foreign key
        Schema::table('stores', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Step 5: Drop user_uuid column
        Schema::table('stores', function (Blueprint $table) {
            $table->dropForeign(['user_uuid']);
            $table->dropColumn('user_uuid');
        });
    }
};
