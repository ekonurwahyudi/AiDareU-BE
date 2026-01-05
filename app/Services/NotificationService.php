<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Create a new notification
     */
    public static function create(
        string $userUuid,
        string $type,
        string $title,
        ?string $description = null,
        ?array $data = null,
        ?string $icon = null,
        ?string $color = null,
        ?string $actionUrl = null
    ): Notification {
        // Get default icon and color based on type if not provided
        if (!$icon) {
            $icon = self::getDefaultIcon($type);
        }

        if (!$color) {
            $color = self::getDefaultColor($type);
        }

        return Notification::create([
            'user_uuid' => $userUuid,
            'type' => $type,
            'title' => $title,
            'description' => $description,
            'data' => $data,
            'icon' => $icon,
            'color' => $color,
            'action_url' => $actionUrl,
            'is_read' => false,
        ]);
    }

    /**
     * Create order notification
     */
    public static function createOrderNotification(
        string $userUuid,
        string $orderNumber,
        string $customerName,
        float $totalAmount,
        string $orderId
    ): Notification {
        return self::create(
            userUuid: $userUuid,
            type: 'order',
            title: "Pesanan Baru #{$orderNumber}",
            description: "{$customerName} - Rp " . number_format($totalAmount, 0, ',', '.'),
            data: [
                'order_id' => $orderId,
                'order_number' => $orderNumber,
                'customer_name' => $customerName,
                'total_amount' => $totalAmount,
            ],
            icon: 'tabler-shopping-cart',
            color: 'success',
            actionUrl: "/apps/tokoku/orders/details/{$orderId}"
        );
    }

    /**
     * Create top up coin notification
     */
    public static function createTopUpNotification(
        string $userUuid,
        float $amount,
        int $coins,
        string $status = 'success'
    ): Notification {
        $title = $status === 'success'
            ? "Top Up Berhasil!"
            : "Top Up Sedang Diproses";

        $description = $status === 'success'
            ? "Anda telah top up {$coins} coins senilai Rp " . number_format($amount, 0, ',', '.')
            : "Top up {$coins} coins senilai Rp " . number_format($amount, 0, ',', '.') . " sedang diproses";

        return self::create(
            userUuid: $userUuid,
            type: 'topup',
            title: $title,
            description: $description,
            data: [
                'amount' => $amount,
                'coins' => $coins,
                'status' => $status,
            ],
            icon: 'tabler-coin',
            color: $status === 'success' ? 'success' : 'warning',
            actionUrl: "/apps/coin-transactions"
        );
    }

    /**
     * Create subscription notification
     */
    public static function createSubscriptionNotification(
        string $userUuid,
        string $packageName,
        string $action, // 'upgraded', 'downgraded', 'renewed', 'expired'
        ?string $expiryDate = null
    ): Notification {
        $titles = [
            'upgraded' => "Paket Berhasil Ditingkatkan!",
            'downgraded' => "Paket Berhasil Diturunkan",
            'renewed' => "Paket Berhasil Diperpanjang",
            'expired' => "Paket Anda Telah Berakhir",
        ];

        $descriptions = [
            'upgraded' => "Selamat! Anda telah upgrade ke paket {$packageName}",
            'downgraded' => "Paket Anda telah diturunkan ke {$packageName}",
            'renewed' => "Paket {$packageName} Anda telah diperpanjang" . ($expiryDate ? " hingga {$expiryDate}" : ""),
            'expired' => "Paket {$packageName} Anda telah berakhir. Perpanjang sekarang!",
        ];

        $color = $action === 'expired' ? 'error' : ($action === 'upgraded' ? 'success' : 'primary');

        return self::create(
            userUuid: $userUuid,
            type: 'subscription',
            title: $titles[$action] ?? "Perubahan Paket",
            description: $descriptions[$action] ?? "Paket {$packageName}",
            data: [
                'package_name' => $packageName,
                'action' => $action,
                'expiry_date' => $expiryDate,
            ],
            icon: 'tabler-package',
            color: $color,
            actionUrl: "/apps/settings"
        );
    }

    /**
     * Create subscription reminder notification
     */
    public static function createSubscriptionReminderNotification(
        string $userUuid,
        string $packageName,
        int $daysLeft
    ): Notification {
        $title = "Pengingat Perpanjangan Paket";
        $description = "Paket {$packageName} Anda akan berakhir dalam {$daysLeft} hari. Perpanjang sekarang!";

        return self::create(
            userUuid: $userUuid,
            type: 'reminder',
            title: $title,
            description: $description,
            data: [
                'package_name' => $packageName,
                'days_left' => $daysLeft,
            ],
            icon: 'tabler-bell-ringing',
            color: $daysLeft <= 3 ? 'error' : 'warning',
            actionUrl: "/apps/settings"
        );
    }

    /**
     * Create general info notification
     */
    public static function createInfoNotification(
        string $userUuid,
        string $title,
        string $description,
        ?string $actionUrl = null,
        ?array $data = null
    ): Notification {
        return self::create(
            userUuid: $userUuid,
            type: 'info',
            title: $title,
            description: $description,
            data: $data,
            icon: 'tabler-info-circle',
            color: 'info',
            actionUrl: $actionUrl
        );
    }

    /**
     * Get default icon based on notification type
     */
    private static function getDefaultIcon(string $type): string
    {
        $icons = [
            'order' => 'tabler-shopping-cart',
            'topup' => 'tabler-coin',
            'subscription' => 'tabler-package',
            'reminder' => 'tabler-bell-ringing',
            'info' => 'tabler-info-circle',
        ];

        return $icons[$type] ?? 'tabler-bell';
    }

    /**
     * Get default color based on notification type
     */
    private static function getDefaultColor(string $type): string
    {
        $colors = [
            'order' => 'success',
            'topup' => 'warning',
            'subscription' => 'primary',
            'reminder' => 'info',
            'info' => 'secondary',
        ];

        return $colors[$type] ?? 'primary';
    }

    /**
     * Mark notification as read
     */
    public static function markAsRead(int $notificationId): bool
    {
        $notification = Notification::find($notificationId);

        if (!$notification) {
            return false;
        }

        $notification->markAsRead();
        return true;
    }

    /**
     * Mark all notifications as read for a user
     */
    public static function markAllAsRead(string $userUuid): int
    {
        return Notification::forUser($userUuid)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Delete notification
     */
    public static function delete(int $notificationId): bool
    {
        $notification = Notification::find($notificationId);

        if (!$notification) {
            return false;
        }

        return $notification->delete();
    }

    /**
     * Get unread count for a user
     */
    public static function getUnreadCount(string $userUuid): int
    {
        return Notification::forUser($userUuid)
            ->unread()
            ->count();
    }
}
