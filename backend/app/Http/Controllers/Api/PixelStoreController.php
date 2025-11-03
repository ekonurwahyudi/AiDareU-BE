<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PixelStore;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PixelStoreController extends Controller
{
    /**
     * Get all pixel stores for authenticated user's store
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = null;

            // Try Sanctum auth first
            if ($request->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && $request->header('X-User-UUID')) {
                $uuid = $request->header('X-User-UUID');
                $user = User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated. Please login again.'
                ], 401);
            }

            $store = Store::where('user_id', $user->uuid)->first();
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            // Get pixel stores for this store
            $pixelStores = PixelStore::where('store_uuid', $store->uuid)
                                  ->where('is_active', true)
                                  ->orderBy('pixel_type')
                                  ->orderBy('created_at', 'desc')
                                  ->get();

            return response()->json([
                'success' => true,
                'data' => $pixelStores
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pixel stores',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new pixel store
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'pixel_type' => 'required|string|in:facebook_pixel,tiktok_pixel,google_tag_manager',
            'nama_pixel' => 'nullable|string|max:255',
            'pixel_id' => 'required|string|max:255',
            'convention_event' => 'nullable|string',
            'test_code' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = null;

            // Try Sanctum auth first
            if ($request->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && $request->header('X-User-UUID')) {
                $uuid = $request->header('X-User-UUID');
                $user = User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated. Please login again.'
                ], 401);
            }

            $store = Store::where('user_id', $user->uuid)->first();
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            // Allow multiple pixels of the same type for this store

            $pixelStore = PixelStore::create([
                'uuid' => Str::uuid(),
                'store_uuid' => $store->uuid,
                'pixel_type' => $request->pixel_type,
                'nama_pixel' => $request->nama_pixel,
                'pixel_id' => $request->pixel_id,
                'convention_event' => $request->convention_event,
                'test_code' => $request->test_code,
                'is_active' => true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pixel store created successfully',
                'data' => $pixelStore
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create pixel store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update pixel store
     */
    public function update(Request $request, $pixelUuid): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama_pixel' => 'nullable|string|max:255',
            'pixel_id' => 'required|string|max:255',
            'convention_event' => 'nullable|string',
            'test_code' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = null;

            // Try Sanctum auth first
            if ($request->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && $request->header('X-User-UUID')) {
                $uuid = $request->header('X-User-UUID');
                $user = User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated. Please login again.'
                ], 401);
            }

            $store = Store::where('user_id', $user->uuid)->first();
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            $pixelStore = PixelStore::where('uuid', $pixelUuid)
                                  ->where('store_uuid', $store->uuid)
                                  ->first();

            if (!$pixelStore) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pixel store not found'
                ], 404);
            }

            $pixelStore->update([
                'nama_pixel' => $request->nama_pixel,
                'pixel_id' => $request->pixel_id,
                'convention_event' => $request->convention_event,
                'test_code' => $request->test_code
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pixel store updated successfully',
                'data' => $pixelStore
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update pixel store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete pixel store
     */
    public function destroy($pixelUuid): JsonResponse
    {
        try {
            $user = null;

            // Try Sanctum auth first
            if ($request->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && $request->header('X-User-UUID')) {
                $uuid = $request->header('X-User-UUID');
                $user = User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated. Please login again.'
                ], 401);
            }

            $store = Store::where('user_id', $user->uuid)->first();
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            $pixelStore = PixelStore::where('uuid', $pixelUuid)
                                  ->where('store_uuid', $store->uuid)
                                  ->first();

            if (!$pixelStore) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pixel store not found'
                ], 404);
            }

            $pixelStore->delete();

            return response()->json([
                'success' => true,
                'message' => 'Pixel store deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete pixel store',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
