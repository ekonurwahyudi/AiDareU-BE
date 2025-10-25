<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class RBACController extends Controller
{
    /**
     * Get current user with roles and permissions
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles.permissions', 'stores']);
        
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Get current user permissions
     */
    public function myPermissions(Request $request): JsonResponse
    {
        $storeId = $request->get('store_id');
        $permissions = $request->user()->getAllPermissions($storeId);
        
        return response()->json([
            'success' => true,
            'data' => $permissions
        ]);
    }

    /**
     * Get all users with pagination
     */
    public function getUsers(Request $request): JsonResponse
    {
        $perPage = min($request->get('per_page', 10), 100);
        $storeId = $request->get('store_id');
        
        $query = User::with(['roles', 'stores']);
        
        if ($storeId) {
            $query->whereHas('stores', function($q) use ($storeId) {
                $q->where('stores.id', $storeId);
            });
        }
        
        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        return response()->json($users);
    }

    /**
     * Create new user
     */
    public function createUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama_lengkap' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'no_hp' => 'required|string|regex:/^(\+62|62|0)[0-9]{9,13}$/',
            'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
            'store_id' => 'nullable|exists:stores,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'name' => $request->nama_lengkap,
                'nama_lengkap' => $request->nama_lengkap,
                'email' => $request->email,
                'no_hp' => $request->no_hp,
                'password' => Hash::make($request->password),
                'email_verified_at' => now(),
                'is_active' => true,
            ]);

            // Assign roles
            foreach ($request->role_ids as $roleId) {
                $role = Role::findOrFail($roleId);
                $user->assignRole($role, $request->store_id);
            }

            $user->load(['roles', 'stores']);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user
     */
    public function updateUser(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'nama_lengkap' => 'required|string|min:2|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
                'no_hp' => 'required|string|regex:/^(\+62|62|0)[0-9]{9,13}$/',
                'role_ids' => 'required|array|min:1',
                'role_ids.*' => 'exists:roles,id',
                'is_active' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user->update([
                'nama_lengkap' => $request->nama_lengkap,
                'email' => $request->email,
                'no_hp' => $request->no_hp,
                'is_active' => $request->is_active,
            ]);

            // Update roles
            $user->userRoles()->delete();
            foreach ($request->role_ids as $roleId) {
                $role = Role::findOrFail($roleId);
                $user->assignRole($role);
            }

            $user->load(['roles', 'stores']);

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle user status
     */
    public function toggleUserStatus(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $user->update(['is_active' => !$user->is_active]);

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully',
                'data' => $user
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }
    }

    /**
     * Delete user
     */
    public function deleteUser($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            // Don't allow deleting superadmin
            if ($user->hasRole('superadmin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete superadmin user'
                ], 403);
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }
    }

    /**
     * Assign roles to user
     */
    public function assignRoles(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
            'store_id' => 'nullable|exists:stores,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::findOrFail($request->user_id);
            
            // Remove existing roles for this context
            if ($request->store_id) {
                $user->userRoles()->where('store_id', $request->store_id)->delete();
            } else {
                $user->userRoles()->whereNull('store_id')->delete();
            }

            // Assign new roles
            foreach ($request->role_ids as $roleId) {
                $role = Role::findOrFail($roleId);
                $user->assignRole($role, $request->store_id);
            }

            $user->load(['roles', 'stores']);

            return response()->json([
                'success' => true,
                'message' => 'Roles assigned successfully',
                'data' => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all roles
     */
    public function getRoles(): JsonResponse
    {
        $roles = Role::with('permissions')->orderBy('level', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }

    /**
     * Get all permissions
     */
    public function getPermissions(): JsonResponse
    {
        $permissions = Permission::orderBy('module')->orderBy('action')->get();
        
        return response()->json([
            'success' => true,
            'data' => $permissions
        ]);
    }
}