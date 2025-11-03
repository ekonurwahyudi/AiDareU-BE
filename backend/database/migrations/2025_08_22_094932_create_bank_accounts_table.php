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
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('account_holder_name');
            $table->string('account_number');
            $table->string('bank_name');
            $table->string('bank_code')->nullable();
            $table->string('branch_name')->nullable();
            $table->enum('account_type', ['checking', 'savings', 'business'])->default('savings');
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('additional_info')->nullable();
            $table->timestamps();
            
            $table->index('store_id');
            $table->index('uuid');
            $table->index(['store_id', 'is_primary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
    }
};
