<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class StoreController extends Controller
{
    /**
     * Create new store
     */
    public function create(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama_toko'     => 'required|string|min:3|max:50',
            'subdomain'     => 'required|string|min:3|max:30|regex:/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/|unique:stores,subdomain',
            'no_hp_toko' => [
                                'required',
                                'string',
                                'regex:/^(?:\+62|62|0|8)[0-9]{8,13}$/'
                            ],
            'kategori_toko' => 'required|in:fashion,elektronik,makanan,kesehatan,rumah_tangga,olahraga,buku_media,otomotif,mainan_hobi,jasa,lainnya',
            'deskripsi_toko'=> 'required|string|min:20|max:500',
            'alamat'        => 'nullable|string|max:500',
            'is_active'     => 'boolean'
        ]);


        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();
            
            // Check if user already has a store (limit 1 store per user for now)
            if ($user->ownedStores()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'User already has a store'
                ], 400);
            }

            $store = Store::create([
                'uuid' => \Illuminate\Support\Str::uuid(),
                'name' => $request->nama_toko,
                'subdomain' => strtolower($request->subdomain),
                'phone' => $request->no_hp_toko,
                'category' => $request->kategori_toko,
                'description' => $request->deskripsi_toko,
                'user_id' => $user->uuid,
                'is_active' => true,
            ]);

            // Assign owner role to user for this store
            $ownerRole = Role::where('name', 'owner')->first();
            if ($ownerRole) {
                $user->assignRole($ownerRole, $store->id);
            }

            $store->load('owner');

            return response()->json([
                'success' => true,
                'message' => 'Store created successfully',
                'data' => $store
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get stores list
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min($request->get('per_page', 10), 100);
        $user = $request->user();

        $query = Store::with(['owner', 'users']);

        // If not superadmin, only show stores user has access to
        if (!$user->hasRole('superadmin')) {
            $query->where(function($q) use ($user) {
                $q->where('user_id', $user->uuid)
                  ->orWhereHas('users', function($q2) use ($user) {
                      $q2->where('users.id', $user->id);
                  });
            });
        }

        $stores = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($stores);
    }

    /**
     * Get single store
     */
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $store = Store::with(['owner', 'users.roles'])->findOrFail($id);
            $user = $request->user();

            // Check if user has access to this store
            if (!$user->hasRole('superadmin') && !$store->hasUser($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to store'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $store
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Store not found'
            ], 404);
        }
    }

    /**
     * Update store
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            // Try to find by UUID first, then by ID
            $store = Store::where('uuid', $id)->first();
            if (!$store) {
                $store = Store::find($id);
            }

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            // Try multiple authentication methods
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

            // Check if user can update this store
            if (!$user->hasRole('superadmin') &&
                !$user->hasRole('owner', $store->id) &&
                $store->user_id !== $user->uuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update store'
                ], 403);
            }

            // Make validation flexible - only validate fields that are present
            $rules = [];

            if ($request->has('nama_toko')) {
                $rules['nama_toko'] = 'required|string|min:3|max:50';
            }
            if ($request->has('subdomain')) {
                $rules['subdomain'] = 'required|string|min:3|max:30|regex:/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/|unique:stores,subdomain,' . $store->id;
            }
            if ($request->has('no_hp_toko')) {
                $rules['no_hp_toko'] = 'required|string|regex:/^(?:\+62|62|0|8)[0-9]{8,13}$/';
            }
            if ($request->has('kategori_toko')) {
                $rules['kategori_toko'] = 'required|in:fashion,elektronik,makanan,kesehatan,rumah_tangga,olahraga,buku_media,otomotif,mainan_hobi,jasa,lainnya';
            }
            if ($request->has('deskripsi_toko')) {
                $rules['deskripsi_toko'] = 'required|string|min:20|max:500';
            }
            if ($request->has('alamat')) {
                $rules['alamat'] = 'nullable|string|max:500';
            }
            if ($request->has('domain')) {
                $rules['domain'] = 'nullable|string|max:255';
            }
            if ($request->has('is_active')) {
                $rules['is_active'] = 'boolean';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Map frontend field names to database column names
            $updateData = [];
            if ($request->has('nama_toko')) {
                $updateData['name'] = $request->nama_toko;
            }
            if ($request->has('subdomain')) {
                $updateData['subdomain'] = $request->subdomain;
            }
            if ($request->has('no_hp_toko')) {
                $phone = $request->no_hp_toko;
                // Auto-convert phone starting with 8 to 628
                if (preg_match('/^8[0-9]{8,13}$/', $phone)) {
                    $phone = '62' . $phone;
                }
                // Convert phone starting with 0 to 62
                elseif (preg_match('/^0[0-9]{9,13}$/', $phone)) {
                    $phone = '62' . substr($phone, 1);
                }
                $updateData['phone'] = $phone;
            }
            if ($request->has('kategori_toko')) {
                $updateData['category'] = $request->kategori_toko;
            }
            if ($request->has('deskripsi_toko')) {
                $updateData['description'] = $request->deskripsi_toko;
            }
            if ($request->has('alamat')) {
                $updateData['alamat'] = $request->alamat;
            }
            if ($request->has('domain')) {
                $updateData['domain'] = $request->domain;
            }
            if ($request->has('is_active')) {
                $updateData['is_active'] = $request->is_active;
            }
            
            $store->update($updateData);
            $store->load('owner');

            return response()->json([
                'success' => true,
                'message' => 'Store updated successfully',
                'data' => $store
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Store not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Switch current store context
     */
    public function switchStore(Request $request, $id): JsonResponse
    {
        try {
            $store = Store::findOrFail($id);
            $user = $request->user();

            // Check if user has access to this store
            if (!$store->hasUser($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to store'
                ], 403);
            }

            // Store current store in session or return it
            session(['current_store_id' => $store->id]);

            return response()->json([
                'success' => true,
                'message' => 'Store context switched successfully',
                'data' => $store
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Store not found'
            ], 404);
        }
    }

    /**
     * Get store users
     */
    public function getStoreUsers(Request $request, $id): JsonResponse
    {
        try {
            $store = Store::findOrFail($id);
            $user = $request->user();

            // Check if user can view store users
            if (!$user->hasRole('superadmin') && 
                !$user->hasRole('owner', $store->id) && 
                $store->user_id !== $user->uuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to view store users'
                ], 403);
            }

            $users = $store->users()->with('roles')->get();

            return response()->json([
                'success' => true,
                'data' => $users
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Store not found'
            ], 404);
        }
    }

    /**
     * Check subdomain availability
     */
    public function checkSubdomain(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'subdomain' => 'required|string|min:3|max:30|regex:/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid subdomain format',
                'errors' => $validator->errors()
            ], 422);
        }

        $exists = Store::where('subdomain', strtolower($request->subdomain))->exists();

        return response()->json([
            'success' => true,
            'available' => !$exists,
            'message' => $exists ? 'Subdomain not available' : 'Subdomain available'
        ]);
    }
}