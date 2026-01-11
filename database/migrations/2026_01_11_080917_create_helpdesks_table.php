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
        Schema::create('helpdesks', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('ticket_number', 50)->unique();
            $table->string('title');
            $table->string('category', 100);
            $table->enum('department', ['Support IT', 'Sales/Billing', 'Abuse'])->default('Support IT');
            $table->enum('status', ['open', 'waiting_reply', 'replied', 'closed'])->default('open');
            $table->enum('priority', ['low', 'medium', 'high'])->default('low');
            $table->timestamps();

            $table->index('user_id');
            $table->index('ticket_number');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('helpdesks');
    }
};
