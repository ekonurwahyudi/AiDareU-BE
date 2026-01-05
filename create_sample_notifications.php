<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\NotificationService;
use App\Models\User;

echo "Creating Sample Notifications\n";
echo "==============================\n\n";

// Get first user
$user = User::first();

if (!$user) {
    echo "No users found. Please create a user first.\n";
    exit(1);
}

echo "Creating notifications for user: {$user->name} ({$user->uuid})\n\n";

// 1. Order Notification
echo "1. Creating Order Notification...\n";
NotificationService::createOrderNotification(
    userUuid: $user->uuid,
    orderNumber: 'ORD-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
    customerName: 'John Doe',
    totalAmount: 250000,
    orderId: 'uuid-order-123'
);
echo "   ✓ Order notification created\n\n";

// 2. Top Up Success Notification
echo "2. Creating Top Up Success Notification...\n";
NotificationService::createTopUpNotification(
    userUuid: $user->uuid,
    amount: 100000,
    coins: 1000,
    status: 'success'
);
echo "   ✓ Top up success notification created\n\n";

// 3. Top Up Pending Notification
echo "3. Creating Top Up Pending Notification...\n";
NotificationService::createTopUpNotification(
    userUuid: $user->uuid,
    amount: 50000,
    coins: 500,
    status: 'pending'
);
echo "   ✓ Top up pending notification created\n\n";

// 4. Subscription Upgraded
echo "4. Creating Subscription Upgrade Notification...\n";
NotificationService::createSubscriptionNotification(
    userUuid: $user->uuid,
    packageName: 'Premium',
    action: 'upgraded'
);
echo "   ✓ Subscription upgrade notification created\n\n";

// 5. Subscription Reminder
echo "5. Creating Subscription Reminder (7 days)...\n";
NotificationService::createSubscriptionReminderNotification(
    userUuid: $user->uuid,
    packageName: 'Premium',
    daysLeft: 7
);
echo "   ✓ Subscription reminder created\n\n";

// 6. Subscription Urgent Reminder
echo "6. Creating Urgent Subscription Reminder (2 days)...\n";
NotificationService::createSubscriptionReminderNotification(
    userUuid: $user->uuid,
    packageName: 'Premium',
    daysLeft: 2
);
echo "   ✓ Urgent subscription reminder created\n\n";

// 7. Info Notification - New Feature
echo "7. Creating Info Notification (New Feature)...\n";
NotificationService::createInfoNotification(
    userUuid: $user->uuid,
    title: 'Fitur Baru Tersedia!',
    description: 'Coba fitur AI Product Photo yang baru untuk meningkatkan penjualan Anda',
    actionUrl: '/apps/tokoku/ai-brandings',
    data: [
        'feature' => 'ai_product_photo',
        'version' => '2.0'
    ]
);
echo "   ✓ Info notification created\n\n";

// 8. Info Notification - Maintenance
echo "8. Creating Info Notification (Maintenance)...\n";
NotificationService::createInfoNotification(
    userUuid: $user->uuid,
    title: 'Pemeliharaan Sistem',
    description: 'Sistem akan maintenance pada 10 Jan 2024 pukul 02:00 - 04:00 WIB'
);
echo "   ✓ Maintenance notification created\n\n";

// 9. Another Order Notification (this one will be marked as read)
echo "9. Creating Another Order Notification (will be marked as read)...\n";
$notification = NotificationService::createOrderNotification(
    userUuid: $user->uuid,
    orderNumber: 'ORD-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
    customerName: 'Jane Smith',
    totalAmount: 175000,
    orderId: 'uuid-order-456'
);
$notification->markAsRead();
echo "   ✓ Order notification created and marked as read\n\n";

// Get unread count
$unreadCount = NotificationService::getUnreadCount($user->uuid);

echo "==============================\n";
echo "Summary:\n";
echo "- Total notifications created: 9\n";
echo "- Unread notifications: {$unreadCount}\n";
echo "- Read notifications: " . (9 - $unreadCount) . "\n";
echo "\nYou can now check the notifications in the frontend!\n";
echo "API Endpoint: /api/notifications\n";
