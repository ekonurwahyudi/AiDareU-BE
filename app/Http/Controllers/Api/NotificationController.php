<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request)
    {
        try {
            // Get user UUID from authenticated user or request
            $userUuid = $this->getUserUuid($request);

            if (!$userUuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                    'data' => []
                ], 401);
            }

            $perPage = $request->get('per_page', 20);
            $type = $request->get('type'); // Filter by type if provided

            $query = Notification::forUser($userUuid)
                ->orderBy('created_at', 'desc');

            // Filter by type if provided
            if ($type) {
                $query->ofType($type);
            }

            $notifications = $query->paginate($perPage);

            // Get unread count
            $unreadCount = Notification::forUser($userUuid)
                ->unread()
                ->count();

            return response()->json([
                'success' => true,
                'data' => $notifications->items(),
                'unread_count' => $unreadCount,
                'total' => $notifications->total(),
                'current_page' => $notifications->currentPage(),
                'per_page' => $notifications->perPage(),
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
     * Get unread notifications only
     */
    public function unread(Request $request)
    {
        try {
            $userUuid = $this->getUserUuid($request);

            if (!$userUuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                    'data' => []
                ], 401);
            }

            $notifications = Notification::forUser($userUuid)
                ->unread()
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $notifications,
                'unread_count' => $notifications->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching unread notifications: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $userUuid = $this->getUserUuid($request);

            $notification = Notification::where('id', $id)
                ->where('user_uuid', $userUuid)
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification not found'
                ], 404);
            }

            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
                'data' => $notification
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error marking notification as read: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        try {
            $userUuid = $this->getUserUuid($request);

            Notification::forUser($userUuid)
                ->unread()
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error marking all notifications as read: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, $id)
    {
        try {
            $userUuid = $this->getUserUuid($request);

            $notification = Notification::where('id', $id)
                ->where('user_uuid', $userUuid)
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification not found'
                ], 404);
            }

            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notification deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting notification: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get unread count
     */
    public function unreadCount(Request $request)
    {
        try {
            $userUuid = $this->getUserUuid($request);

            if (!$userUuid) {
                return response()->json([
                    'success' => true,
                    'unread_count' => 0
                ]);
            }

            $count = Notification::forUser($userUuid)
                ->unread()
                ->count();

            return response()->json([
                'success' => true,
                'unread_count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error getting unread count: ' . $e->getMessage(),
                'unread_count' => 0
            ], 500);
        }
    }

    /**
     * Get user UUID from request or auth
     */
    private function getUserUuid(Request $request)
    {
        // Try to get from authenticated user
        if (Auth::check()) {
            return Auth::user()->uuid;
        }

        // Try from request
        if ($request->has('user_uuid')) {
            return $request->get('user_uuid');
        }

        // Try from header
        if ($request->header('X-User-UUID')) {
            return $request->header('X-User-UUID');
        }

        return null;
    }
}
