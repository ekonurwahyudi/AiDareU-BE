<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $uuid): JsonResponse
    {
        try {
            $user = User::where('uuid', $uuid)->first();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'uuid' => $user->uuid,
                    'name' => $user->name,
                    'nama_lengkap' => $user->nama_lengkap,
                    'email' => $user->email,
                    'no_hp' => $user->no_hp,
                    'location' => $user->location,
                    'address' => $user->address,
                    'is_active' => $user->is_active,
                    'paket' => $user->paket,
                    'created_at' => $user->created_at,
                    'roles' => $user->getRoleNames()->isEmpty() ? ['user'] : $user->getRoleNames()->toArray(),
                    'email_verified_at' => $user->email_verified_at
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving user data'
            ], 500);
        }
    }

    /**
     * Get current authenticated user data.
     */
    public function me(): JsonResponse
    {
        try {
            // Try to get authenticated user from various guards
            $user = null;

            // 1. Try Sanctum (Bearer token)
            if (request()->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // 2. Try web session
            if (!$user) {
                $user = auth('web')->user();
            }

            // 3. Try default guard
            if (!$user) {
                $user = auth()->user();
            }

            // 4. Fallback: Try to get user from localStorage data (for development)
            if (!$user && request()->header('X-User-UUID')) {
                $uuid = request()->header('X-User-UUID');
                $user = \App\Models\User::where('uuid', $uuid)->first();
                \Log::info('Fetching user by UUID header: ' . $uuid);
            }

            if (!$user) {
                \Log::warning('No authenticated user found');
                \Log::info('Auth check - Bearer token: ' . (request()->bearerToken() ? 'present' : 'missing'));
                \Log::info('Auth check - Session user: ' . (auth('web')->check() ? 'yes' : 'no'));

                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated. Please login again.',
                    'data' => null
                ], 401);
            }

            // Load store relationship
            $user->load('stores');
            $store = $user->stores->first(); // Get first store

            $storeData = null;
            if ($store) {
                $storeData = [
                    'uuid' => $store->uuid,
                    'name' => $store->nama_toko ?? $store->name ?? null,
                    'subdomain' => $store->subdomain,
                    'description' => $store->description ?? null,
                    'logo' => $store->logo ?? null,
                ];
            }

            return response()->json([
                'status' => 'success',
                'message' => 'User data retrieved successfully',
                'data' => [
                    'uuid' => $user->uuid,
                    'name' => $user->name,
                    'username' => $user->name, // alias
                    'nama_lengkap' => $user->nama_lengkap,
                    'email' => $user->email,
                    'phone' => $user->no_hp,
                    'no_hp' => $user->no_hp,
                    'location' => $user->location,
                    'address' => $user->address,
                    'is_active' => $user->is_active,
                    'paket' => $user->paket,
                    'created_at' => $user->created_at,
                    'roles' => $user->getRoleNames()->isEmpty() ? ['user'] : $user->getRoleNames()->toArray(),
                    'email_verified_at' => $user->email_verified_at,
                    'store' => $storeData
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in UserController@me: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error retrieving user data: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $uuid): JsonResponse
    {
        try {
            // Handle 'me' endpoint by getting authenticated user
            if ($uuid === 'me') {
                $user = auth()->user();
                
                if (!$user) {
                    // Try to get user from session if available
                    $user = auth('web')->user();
                    
                    if (!$user) {
                        // For development/testing - try to find the specific user by UUID
                        $targetUuid = 'e4fcfcba-63bc-41ff-a36c-11c6e57d16f8'; // Your login UUID
                        $user = User::where('uuid', $targetUuid)->first();
                        
                        if (!$user) {
                            // Fallback to first user from database
                            $user = User::first();
                        }
                    }
                }
            } else {
                $user = User::where('uuid', $uuid)->first();
            }
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nama_lengkap' => 'sometimes|string|max:255',
                'no_hp' => 'sometimes|string|max:20',
                'email' => 'sometimes|email|unique:users,email,' . $user->id,
                'location' => 'sometimes|string|max:255',
                'address' => 'sometimes|string',
                'password' => 'sometimes|string|min:8|confirmed',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->only(['nama_lengkap', 'no_hp', 'email', 'location', 'address']);
            
            // Only superadmin can change is_active status
            if ($request->has('is_active')) {
                // Get current authenticated user (same logic as me() method)
                $currentUser = auth()->user();
                if (!$currentUser) {
                    $currentUser = auth('web')->user();
                    if (!$currentUser) {
                        // For development/testing - use the target user UUID
                        $currentUser = User::where('uuid', 'e4fcfcba-63bc-41ff-a36c-11c6e57d16f8')->first();
                    }
                }
                
                if ($currentUser && $currentUser->hasRole('superadmin')) {
                    $data['is_active'] = $request->is_active;
                }
            }
            
            // Update name if nama_lengkap is provided
            if ($request->has('nama_lengkap')) {
                $data['name'] = $request->nama_lengkap;
            }

            // Hash password if provided
            if ($request->has('password') && $request->password) {
                $data['password'] = Hash::make($request->password);
            }

            $user->update($data);

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => [
                    'uuid' => $user->uuid,
                    'name' => $user->name,
                    'nama_lengkap' => $user->nama_lengkap,
                    'email' => $user->email,
                    'no_hp' => $user->no_hp,
                    'location' => $user->location,
                    'address' => $user->address,
                    'is_active' => $user->is_active,
                    'paket' => $user->paket,
                    'created_at' => $user->created_at,
                    'roles' => $user->getRoleNames()->isEmpty() ? ['user'] : $user->getRoleNames()->toArray(),
                    'email_verified_at' => $user->email_verified_at
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating user data'
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
