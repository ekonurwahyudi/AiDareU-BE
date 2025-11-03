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
        // Add custom fields to permissions table
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('display_name')->after('name');
            $table->text('description')->nullable()->after('display_name');
            $table->string('module')->after('description');
            $table->string('action')->after('module');
            $table->string('resource')->after('action');
            $table->boolean('is_system')->default(false)->after('resource');
        });

        // Add custom fields to roles table
        Schema::table('roles', function (Blueprint $table) {
            $table->string('display_name')->after('name');
            $table->text('description')->nullable()->after('display_name');
            $table->integer('level')->default(1)->after('description');
            $table->boolean('is_system')->default(false)->after('level');
        });

        // Add store relationship to model_has_roles for multi-tenant
        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('store_id')->nullable()->after('model_id');
            // We'll add the foreign key constraint after stores table exists
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn([
                'display_name',
                'description', 
                'module',
                'action',
                'resource',
                'is_system'
            ]);
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn([
                'display_name',
                'description',
                'level',
                'is_system'
            ]);
        });

        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->dropColumn('store_id');
        });
    }
};
