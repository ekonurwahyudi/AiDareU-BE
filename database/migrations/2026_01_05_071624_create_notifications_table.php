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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_uuid'); // User UUID from users table
            $table->string('type'); // order, topup, subscription, reminder, info, etc
            $table->string('title'); // Notification title
            $table->text('description')->nullable(); // Notification description
            $table->json('data')->nullable(); // Additional data (order_id, amount, etc)
            $table->string('icon')->nullable(); // Icon name or class
            $table->string('color')->default('primary'); // Color: primary, success, warning, error, info
            $table->string('action_url')->nullable(); // URL to redirect when clicked
            $table->boolean('is_read')->default(false); // Read status
            $table->timestamp('read_at')->nullable(); // When notification was read
            $table->timestamps();
            $table->softDeletes(); // Soft delete for notification history

            // Indexes
            $table->index('user_uuid');
            $table->index('type');
            $table->index('is_read');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
