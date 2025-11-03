<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\SocialMedia;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SocialMediaController extends Controller
{
    public function index(Request $request, $store)
    {
        return response()->json(['data' => [], 'message' => 'OK']);
    }

    public function store(Request $request, $store)
    {
        return response()->json(['message' => 'Created'], 201);
    }

    public function update(Request $request, $store, $socialMedia)
    {
        return response()->json(['message' => 'Updated']);
    }

    public function destroy($store, $socialMedia)
    {
        return response()->json(null, 204);
    }

    public function bulkUpdate(Request $request, $store)
    {
        return response()->json(['message' => 'Bulk updated']);
    }

    /**
     * Get social media accounts for current user's store
     */
    public function userIndex(): JsonResponse
    {
        try {
            $user = null;

            // Try Sanctum auth first
            if (request()->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && request()->header('X-User-UUID')) {
                $uuid = request()->header('X-User-UUID');
                $user = \App\Models\User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated. Please login again.'
                ], 401);
            }

            // Get user's store
            $store = Store::where('user_id', $user->uuid)->first();
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found',
                    'data' => []
                ], 404);
            }

            // Get social media record for this store
            $socialMedia = SocialMedia::where('store_uuid', $store->uuid)->first();
            
            // Convert database format to normalized format expected by frontend
            $platforms = ['Instagram', 'Facebook', 'TikTok', 'YouTube'];
            $data = [];

            if ($socialMedia) {
                $platformMapping = [
                    'Instagram' => 'instagram_url',
                    'Facebook' => 'facebook_url',
                    'TikTok' => 'tiktok_url',
                    'YouTube' => 'youtube_url'
                ];

                foreach ($platforms as $platform) {
                    $urlField = $platformMapping[$platform];
                    if (!empty($socialMedia->$urlField)) {
                        $data[] = [
                            'uuid' => $socialMedia->uuid . '-' . strtolower($platform),
                            'store_uuid' => $socialMedia->store_uuid,
                            'platform' => $platform,
                            'url' => $socialMedia->$urlField,
                            'is_active' => $socialMedia->is_active,
                            'created_at' => $socialMedia->created_at,
                            'updated_at' => $socialMedia->updated_at
                        ];
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get social media accounts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create or update social media account for current user's store
     */
    public function userStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:Instagram,Facebook,TikTok,YouTube',
            'url' => 'required|url|max:255',
            'is_active' => 'boolean'
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
            if (request()->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && request()->header('X-User-UUID')) {
                $uuid = request()->header('X-User-UUID');
                $user = \App\Models\User::where('uuid', $uuid)->first();
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

            $platformMapping = [
                'Instagram' => 'instagram_url',
                'Facebook' => 'facebook_url',
                'TikTok' => 'tiktok_url',
                'YouTube' => 'youtube_url'
            ];

            $urlField = $platformMapping[$request->platform];

            // Get or create social media record
            $socialMedia = SocialMedia::firstOrCreate(
                ['store_uuid' => $store->uuid],
                [
                    'uuid' => Str::uuid(),
                    'store_uuid' => $store->uuid,
                    'is_active' => true
                ]
            );

            // Update the specific platform URL
            $socialMedia->$urlField = $request->url;
            $socialMedia->is_active = $request->get('is_active', true);
            $socialMedia->save();

            return response()->json([
                'success' => true,
                'message' => 'Social media account saved successfully',
                'data' => [
                    'uuid' => $socialMedia->uuid . '-' . strtolower($request->platform),
                    'store_uuid' => $socialMedia->store_uuid,
                    'platform' => $request->platform,
                    'url' => $request->url,
                    'is_active' => $socialMedia->is_active
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save social media account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update social media account
     */
    public function userUpdate(Request $request, $socialMediaId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:Instagram,Facebook,TikTok,YouTube',
            'url' => 'required|url|max:255',
            'is_active' => 'boolean'
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
            if (request()->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && request()->header('X-User-UUID')) {
                $uuid = request()->header('X-User-UUID');
                $user = \App\Models\User::where('uuid', $uuid)->first();
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

            // Extract real UUID from composite ID (remove platform suffix)
            $realUuid = preg_replace('/-[a-z]+$/', '', $socialMediaId);

            $socialMedia = SocialMedia::where('uuid', $realUuid)
                                   ->where('store_uuid', $store->uuid)
                                   ->first();

            if (!$socialMedia) {
                return response()->json([
                    'success' => false,
                    'message' => 'Social media account not found'
                ], 404);
            }

            $platformMapping = [
                'Instagram' => 'instagram_url',
                'Facebook' => 'facebook_url',
                'TikTok' => 'tiktok_url',
                'YouTube' => 'youtube_url'
            ];

            $urlField = $platformMapping[$request->platform];
            $socialMedia->$urlField = $request->url;
            $socialMedia->is_active = $request->get('is_active', true);
            $socialMedia->save();

            return response()->json([
                'success' => true,
                'message' => 'Social media account updated successfully',
                'data' => [
                    'uuid' => $socialMedia->uuid . '-' . strtolower($request->platform),
                    'store_uuid' => $socialMedia->store_uuid,
                    'platform' => $request->platform,
                    'url' => $request->url,
                    'is_active' => $socialMedia->is_active
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update social media account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete social media account
     */
    public function userDestroy($socialMediaId): JsonResponse
    {
        try {
            $user = null;

            // Try Sanctum auth first
            if (request()->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && request()->header('X-User-UUID')) {
                $uuid = request()->header('X-User-UUID');
                $user = \App\Models\User::where('uuid', $uuid)->first();
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

            // For delete, we clear the specific platform URL instead of deleting the whole record
            $parts = explode('-', $socialMediaId);
            if (count($parts) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid social media ID'
                ], 400);
            }

            $platform = ucfirst(array_pop($parts));
            $realUuid = implode('-', $parts);

            $socialMedia = SocialMedia::where('uuid', $realUuid)
                                   ->where('store_uuid', $store->uuid)
                                   ->first();

            if (!$socialMedia) {
                return response()->json([
                    'success' => false,
                    'message' => 'Social media account not found'
                ], 404);
            }

            $platformMapping = [
                'Instagram' => 'instagram_url',
                'Facebook' => 'facebook_url',
                'Tiktok' => 'tiktok_url',
                'Youtube' => 'youtube_url'
            ];

            $urlField = $platformMapping[$platform] ?? null;
            if ($urlField) {
                $socialMedia->$urlField = null;
                $socialMedia->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Social media account deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete social media account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getPlatforms()
    {
        $platforms = [
            ['key' => 'facebook', 'label' => 'Facebook'],
            ['key' => 'instagram', 'label' => 'Instagram'],
            ['key' => 'twitter', 'label' => 'X/Twitter'],
            ['key' => 'tiktok', 'label' => 'TikTok'],
            ['key' => 'youtube', 'label' => 'YouTube'],
            ['key' => 'linkedin', 'label' => 'LinkedIn'],
            ['key' => 'whatsapp', 'label' => 'WhatsApp'],
            ['key' => 'telegram', 'label' => 'Telegram'],
        ];

        return response()->json(['data' => $platforms]);
    }
}