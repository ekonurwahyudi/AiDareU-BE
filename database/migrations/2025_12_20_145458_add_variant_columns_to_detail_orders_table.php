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
        Schema::table('detail_orders', function (Blueprint $table) {
            $table->string('variant_name')->nullable()->after('price');
            $table->string('variant_option')->nullable()->after('variant_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_orders', function (Blueprint $table) {
            $table->dropColumn(['variant_name', 'variant_option']);
        });
    }
};
