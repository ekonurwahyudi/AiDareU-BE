<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Get order notifications for logged-in user's store
     */
    public function getOrderNotifications(Request $request)
    {
        try {
            // Get user UUID from request or auth header
            $userUuid = $request->get('user_uuid');

            // Try to get from auth header if not in query
            if (!$userUuid && $request->header('X-User-UUID')) {
                $userUuid = $request->header('X-User-UUID');
            }

            if (!$userUuid) {
                return response()->json([
                    'success' => true,
                    'message' => 'No user UUID provided',
                    'data' => [],
                    'unread_count' => 0
                ]);
            }

            // Find user's store
            $user = User::where('uuid', $userUuid)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                    'data' => []
                ], 404);
            }

            // Find store by user_id (which stores the user's UUID)
            $store = Store::where('user_id', $user->uuid)->first();

            if (!$store) {
                return response()->json([
                    'success' => true,
                    'message' => 'No store found for this user',
                    'data' => []
                ]);
            }

            // Get recent orders (last 30 days) for this store
            $orders = Order::where('uuid_store', $store->uuid)
                ->with(['customer', 'detailOrders'])
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get();

            // Transform orders to notification format
            $notifications = $orders->map(function ($order) {
                $customerName = $order->customer ? $order->customer->nama : 'Unknown Customer';
                $itemCount = $order->detailOrders->count();
                $timeAgo = $this->getTimeAgo($order->created_at);

                // Determine if notification is "read" based on order status
                // New orders (pending) are unread, processed orders are read
                $isRead = in_array($order->status, ['Diproses', 'Dikirim', 'Selesai', 'Dibatalkan']);

                return [
                    'id' => $order->uuid,
                    'order_number' => $order->nomor_order,
                    'title' => "New Order #{$order->nomor_order}",
                    'subtitle' => "{$customerName} ordered {$itemCount} item(s) - Rp " . number_format($order->total_harga, 0, ',', '.'),
                    'time' => $timeAgo,
                    'read' => $isRead,
                    'avatarIcon' => 'tabler-shopping-cart',
                    'avatarColor' => $isRead ? 'secondary' : 'success',
                    'status' => $order->status,
                    'total' => $order->total_harga
                ];
            });

            // Count unread notifications (pending orders)
            $unreadCount = $orders->where('status', 'Pending')->count();

            return response()->json([
                'success' => true,
                'data' => $notifications,
                'unread_count' => $unreadCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching notifications: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Mark notification as read (update order status)
     */
    public function markAsRead(Request $request, $orderUuid)
    {
        try {
            $order = Order::where('uuid', $orderUuid)->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Only update if order is still pending
            if ($order->status === 'Pending') {
                $order->status = 'Diproses';
                $order->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
                'data' => $order
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error marking notification as read: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get time ago format
     */
    private function getTimeAgo($datetime)
    {
        $now = Carbon::now();
        $created = Carbon::parse($datetime);

        $diffInMinutes = $created->diffInMinutes($now);
        $diffInHours = $created->diffInHours($now);
        $diffInDays = $created->diffInDays($now);

        if ($diffInMinutes < 1) {
            return 'Just now';
        } elseif ($diffInMinutes < 60) {
            return $diffInMinutes . ' minute' . ($diffInMinutes > 1 ? 's' : '') . ' ago';
        } elseif ($diffInHours < 24) {
            return $diffInHours . ' hour' . ($diffInHours > 1 ? 's' : '') . ' ago';
        } elseif ($diffInDays < 7) {
            return $diffInDays . ' day' . ($diffInDays > 1 ? 's' : '') . ' ago';
        } else {
            return $created->format('M d, Y');
        }
    }
}
