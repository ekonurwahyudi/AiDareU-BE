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
        Schema::table('platformpreneur', function (Blueprint $table) {
            $table->boolean('cart')->default(false)->after('domain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('platformpreneur', function (Blueprint $table) {
            $table->dropColumn('cart');
        });
    }
};
