<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserManagementController extends Controller
{
    /**
     * Get all users with their roles (for master data)
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search');

            $query = User::query();

            // Search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('nama_lengkap', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('no_hp', 'like', "%{$search}%");
                });
            }

            // Include roles and store (where user_id = user.uuid)
            $users = $query->with(['roles', 'stores'])
                          ->orderBy('created_at', 'desc')
                          ->paginate($perPage);

            // Transform the paginated data
            $transformedData = $users->toArray();

            foreach ($transformedData['data'] as &$user) {
                // Transform roles to array of role names
                if (isset($user['roles']) && is_array($user['roles'])) {
                    $user['roles'] = array_column($user['roles'], 'name');
                } else {
                    $user['roles'] = [];
                }

                // Get store name from the first store (where user_id = user.uuid)
                if (isset($user['stores']) && is_array($user['stores']) && count($user['stores']) > 0) {
                    // Try 'name' first, fallback to 'nama_toko' for compatibility
                    $user['store_name'] = $user['stores'][0]['name'] ?? $user['stores'][0]['nama_toko'] ?? '-';
                } else {
                    $user['store_name'] = '-';
                }

                // Remove stores array from response to keep it clean
                unset($user['stores']);
            }

            return response()->json([
                'status' => 'success',
                'data' => $transformedData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single user by UUID
     */
    public function show($uuid)
    {
        try {
            $user = User::with('roles')->where('uuid', $uuid)->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            // Transform roles to array of role names
            $user->roles = $user->roles->pluck('name')->toArray();

            return response()->json([
                'status' => 'success',
                'data' => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new user
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'nama_lengkap' => 'nullable|string|max:255',
                'email' => 'required|email|unique:users,email',
                'no_hp' => 'nullable|string|max:20',
                'password' => 'required|string|min:8',
                'roles' => 'nullable|array',
                'roles.*' => 'string|exists:roles,name',
                'is_active' => 'nullable|boolean',
                'alasan_gabung' => 'nullable|string',
                'info_dari' => 'nullable|string|max:255',
                'location' => 'nullable|string|max:255',
                'address' => 'nullable|string',
                'paket' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $userData = $request->only(['name', 'nama_lengkap', 'email', 'no_hp', 'is_active', 'alasan_gabung', 'info_dari', 'location', 'address', 'paket']);
            $userData['password'] = Hash::make($request->password);

            $user = User::create($userData);

            // Assign roles if provided
            if ($request->has('roles') && is_array($request->roles)) {
                $user->syncRoles($request->roles);
            }

            // Load roles and transform to array of names
            $user->load('roles');
            $user->roles = $user->roles->pluck('name')->toArray();

            return response()->json([
                'status' => 'success',
                'message' => 'User created successfully',
                'data' => $user
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing user
     */
    public function update(Request $request, $uuid)
    {
        try {
            $user = User::where('uuid', $uuid)->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'nama_lengkap' => 'nullable|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
                'no_hp' => 'nullable|string|max:20',
                'password' => 'nullable|string|min:8',
                'roles' => 'nullable|array',
                'roles.*' => 'string|exists:roles,name',
                'is_active' => 'nullable|boolean',
                'alasan_gabung' => 'nullable|string',
                'info_dari' => 'nullable|string|max:255',
                'location' => 'nullable|string|max:255',
                'address' => 'nullable|string',
                'paket' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $userData = $request->only(['name', 'nama_lengkap', 'email', 'no_hp', 'is_active', 'alasan_gabung', 'info_dari', 'location', 'address', 'paket']);

            if ($request->has('password') && $request->password) {
                $userData['password'] = Hash::make($request->password);
            }

            $user->update($userData);

            // Update roles if provided
            if ($request->has('roles') && is_array($request->roles)) {
                $user->syncRoles($request->roles);
            }

            // Load roles and transform to array of names
            $user->load('roles');
            $user->roles = $user->roles->pluck('name')->toArray();

            return response()->json([
                'status' => 'success',
                'message' => 'User updated successfully',
                'data' => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a user
     */
    public function destroy($uuid)
    {
        try {
            $user = User::where('uuid', $uuid)->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            $user->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'User deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
