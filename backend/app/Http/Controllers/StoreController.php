<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StoreController extends Controller
{
    /**
     * Check subdomain availability
     */
    public function checkSubdomain(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'subdomain' => [
                'required',
                'string',
                'min:3',
                'max:50',
                'regex:/^[a-z0-9-]+$/',
                'not_regex:/^(www|api|admin|app|mail|ftp|blog|shop|store|dashboard)$/i'
            ]
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid subdomain format',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $subdomain = strtolower($request->subdomain);
            
            // Check if subdomain exists
            $exists = Store::where('subdomain', $subdomain)->exists();
            
            return response()->json([
                'available' => !$exists,
                'subdomain' => $subdomain
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to check subdomain availability',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show single store by UUID
     */
    public function show(Request $request, $uuid)
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
                $userUuid = $request->header('X-User-UUID');
                $user = User::where('uuid', $userUuid)->first();
            }

            // Require authentication - no fallback to random users!
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required. Please login to view your store.'
                ], 401);
            }

            $store = Store::where('uuid', $uuid)
                          ->where('user_id', $user->uuid)
                          ->first();

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $store->id,
                    'uuid' => $store->uuid,
                    'name' => $store->name,
                    'subdomain' => $store->subdomain,
                    'domain' => $store->domain,
                    'phone' => $store->phone,
                    'category' => $store->category,
                    'description' => $store->description,
                    'provinsi' => $store->provinsi,
                    'kota' => $store->kota,
                    'kecamatan' => $store->kecamatan,
                    'province' => $store->provinsi, // Alias for frontend compatibility
                    'city' => $store->kota,         // Alias for frontend compatibility
                    'district' => $store->kecamatan, // Alias for frontend compatibility
                    'is_active' => $store->is_active,
                    'url' => 'https://' . $store->subdomain . '.aidareu.com',
                    'created_at' => $store->created_at,
                    'updated_at' => $store->updated_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new store
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_toko' => 'required|string|min:2|max:255',
            'subdomain' => [
                'required',
                'string',
                'min:3',
                'max:50',
                'regex:/^[a-z0-9-]+$/',
                'unique:stores,subdomain',
                'not_regex:/^(www|api|admin|app|mail|ftp|blog|shop|store|dashboard)$/i'
            ],
            'no_hp_toko' => ['required', 'string', 'regex:/^(\+62|62|0)[0-9]{9,13}$/'],
            'kategori_toko' => 'required|string|in:fashion,elektronik,makanan,kesehatan,rumah_tangga,olahraga,buku_media,otomotif,mainan_hobi,jasa,lainnya',
            'deskripsi_toko' => 'required|string|min:10|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            
            // Check if user already has a store
            $existingStore = Store::where('user_id', $user->uuid)->first();
            if ($existingStore) {
                return response()->json([
                    'message' => 'User already has a store'
                ], 400);
            }

            // Double check subdomain availability
            $subdomain = strtolower($request->subdomain);
            if (Store::where('subdomain', $subdomain)->exists()) {
                return response()->json([
                    'message' => 'Subdomain is already taken'
                ], 400);
            }

            DB::beginTransaction();

            // Create store
            $store = Store::create([
                'uuid' => Str::uuid(),
                'name' => $request->nama_toko,
                'subdomain' => $subdomain,
                'phone' => $request->no_hp_toko,
                'category' => $request->kategori_toko,
                'description' => $request->deskripsi_toko,
                'user_id' => $user->uuid,
                'is_active' => true
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Store setup completed successfully!',
                'store' => [
                    'id' => $store->id,
                    'uuid' => $store->uuid,
                    'name' => $store->name,
                    'subdomain' => $store->subdomain,
                    'phone' => $store->phone,
                    'category' => $store->category,
                    'description' => $store->description,
                    'is_active' => $store->is_active,
                    'url' => 'https://' . $store->subdomain . '.aidareu.com'
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create store',
                'error' => $e->getMessage()
            ], 500);
        }
        
        /*
        $validator = Validator::make($request->all(), [
            'nama_toko' => 'required|string|min:2|max:255',
            'subdomain' => [
                'required',
                'string',
                'min:3',
                'max:50',
                'regex:/^[a-z0-9-]+$/',
                'unique:stores,subdomain',
                'not_regex:/^(www|api|admin|app|mail|ftp|blog|shop|store|dashboard)$/i'
            ],
            'no_hp_toko' => ['required', 'string', 'regex:/^(\+62|62|0)[0-9]{9,13}$/'],
            'kategori_toko' => 'required|string|in:fashion,elektronik,makanan,kesehatan,rumah_tangga,olahraga,buku_media,otomotif,mainan_hobi,jasa,lainnya',
            'deskripsi_toko' => 'required|string|min:10|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            
            // Check if user already has a store
            $existingStore = Store::where('user_id', $user->uuid)->first();
            if ($existingStore) {
                return response()->json([
                    'message' => 'User already has a store'
                ], 400);
            }

            // Double check subdomain availability
            $subdomain = strtolower($request->subdomain);
            if (Store::where('subdomain', $subdomain)->exists()) {
                return response()->json([
                    'message' => 'Subdomain is already taken'
                ], 400);
            }

            DB::beginTransaction();

            // Create store
            $store = Store::create([
                'uuid' => \Illuminate\Support\Str::uuid(),
                'nama_toko' => $request->nama_toko,
                'subdomain' => $subdomain,
                'no_hp_toko' => $request->no_hp_toko,
                'kategori_toko' => $request->kategori_toko,
                'deskripsi_toko' => $request->deskripsi_toko,
                'user_id' => $user->uuid,
                'is_active' => true
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Store created successfully!',
                'store' => [
                    'id' => $store->id,
                    'nama_toko' => $store->nama_toko,
                    'subdomain' => $store->subdomain,
                    'no_hp_toko' => $store->no_hp_toko,
                    'kategori_toko' => $store->kategori_toko,
                    'deskripsi_toko' => $store->deskripsi_toko,
                    'is_active' => $store->is_active,
                    'url' => 'https://' . $store->subdomain . '.aidareu.com'
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create store',
                'error' => $e->getMessage()
            ], 500);
        }
        */
    }

    /**
     * Get user's stores
     */
    public function index(Request $request)
    {
        try {
            // Check if querying by domain or subdomain
            $domain = $request->query('domain');
            $subdomain = $request->query('subdomain');

            if ($domain) {
                // Public query by custom domain
                $store = Store::where('domain', $domain)
                             ->where('is_active', true)
                             ->first();

                if (!$store) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Store not found'
                    ], 404);
                }

                return response()->json([
                    'success' => true,
                    'data' => [
                        'uuid' => $store->uuid,
                        'name' => $store->name,
                        'subdomain' => $store->subdomain,
                        'domain' => $store->domain,
                        'url' => $store->domain
                            ? 'https://' . $store->domain
                            : 'https://' . $store->subdomain . '.aidareu.com'
                    ]
                ]);
            }

            if ($subdomain) {
                // Public query by subdomain
                $store = Store::where('subdomain', $subdomain)
                             ->where('is_active', true)
                             ->first();

                if (!$store) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Store not found'
                    ], 404);
                }

                return response()->json([
                    'success' => true,
                    'data' => [
                        'uuid' => $store->uuid,
                        'name' => $store->name,
                        'subdomain' => $store->subdomain,
                        'domain' => $store->domain
                    ]
                ]);
            }

            // Default: Get user's stores (authenticated)
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
                $userUuid = $request->header('X-User-UUID');
                $user = User::where('uuid', $userUuid)->first();
            }

            // Require authentication - no fallback to random users!
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required. Please login to view your stores.',
                    'stores' => []
                ], 401);
            }

            $stores = Store::where('user_id', $user->uuid)
                          ->orderBy('created_at', 'desc')
                          ->get()
                          ->map(function ($store) {
                    return [
                        'id' => $store->id,
                        'uuid' => $store->uuid,
                        'name' => $store->name,
                        'subdomain' => $store->subdomain,
                        'domain' => $store->domain,
                        'phone' => $store->phone,
                        'category' => $store->category,
                        'description' => $store->description,
                        'provinsi' => $store->provinsi,
                        'kota' => $store->kota,
                        'kecamatan' => $store->kecamatan,
                        'is_active' => $store->is_active,
                        'url' => 'https://' . $store->subdomain . '.aidareu.com',
                        'created_at' => $store->created_at,
                        'updated_at' => $store->updated_at
                    ];
                });

            return response()->json([
                'stores' => $stores
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to get stores',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test endpoint
     */
    public function test()
    {
        return response()->json([
            'message' => 'Store controller test endpoint works!',
            'user_id' => Auth::check() ? Auth::id() : null,
            'user' => Auth::check() ? Auth::user() : null
        ]);
    }

    /**
     * Get specific store
     */

    /**
     * Update store
     */
    public function update(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            'nama_toko' => 'sometimes|required|string|min:2|max:255',
            'subdomain' => ['sometimes', 'required', 'string', 'min:3', 'max:50', 'regex:/^[a-z0-9-]+$/', 'not_regex:/^(www|api|admin|app|mail|ftp|blog|shop|store|dashboard)$/i'],
            'domain' => 'sometimes|nullable|string|max:255',
            'no_hp_toko' => ['sometimes', 'required', 'string', 'regex:/^(\+62|62|0)[0-9]{9,13}$/'],
            'kategori_toko' => 'sometimes|required|string|in:digital,fashion,elektronik,makanan,kesehatan,rumah_tangga,olahraga,buku_media,otomotif,mainan_hobi,jasa,lainnya',
            'deskripsi_toko' => 'sometimes|required|string|min:10|max:1000',
            'provinsi' => 'sometimes|nullable|string|max:100',
            'kota' => 'sometimes|nullable|string|max:100',
            'kecamatan' => 'sometimes|nullable|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            
            // Fallback authentication if no authenticated user
            if (!$user) {
                $targetUuid = 'e4fcfcba-63bc-41ff-a36c-11c6e57d16f8'; // Eko Wahyudi ST (Serba Ada owner)
                $user = \App\Models\User::where('uuid', $targetUuid)->first();
            }
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not found'
                ], 404);
            }
            
            $store = Store::where('uuid', $uuid)
                ->where('user_id', $user->uuid)
                ->first();

            if (!$store) {
                return response()->json([
                    'message' => 'Store not found'
                ], 404);
            }

            // Additional unique check for subdomain when changed
            if ($request->has('subdomain')) {
                $sub = strtolower($request->subdomain);
                if ($sub !== $store->subdomain && Store::where('subdomain', $sub)->exists()) {
                    return response()->json([
                        'message' => 'Subdomain is already taken'
                    ], 422);
                }
            }

            // Update store
            $updateData = [];
            if ($request->has('nama_toko')) {
                $updateData['name'] = $request->nama_toko;
            }
            if ($request->has('subdomain')) {
                $updateData['subdomain'] = strtolower($request->subdomain);
            }
            if ($request->has('domain')) {
                $updateData['domain'] = $request->domain;
            }
            if ($request->has('no_hp_toko')) {
                $updateData['phone'] = $request->no_hp_toko;
            }
            if ($request->has('kategori_toko')) {
                $updateData['category'] = $request->kategori_toko;
            }
            if ($request->has('deskripsi_toko')) {
                $updateData['description'] = $request->deskripsi_toko;
            }
            // Address fields
            if ($request->has('provinsi')) {
                $updateData['provinsi'] = $request->provinsi;
            }
            if ($request->has('kota')) {
                $updateData['kota'] = $request->kota;
            }
            if ($request->has('kecamatan')) {
                $updateData['kecamatan'] = $request->kecamatan;
            }

            $store->update($updateData);

            return response()->json([
                'message' => 'Store updated successfully!',
                'store' => [
                    'id' => $store->id,
                    'uuid' => $store->uuid,
                    'name' => $store->name,
                    'subdomain' => $store->subdomain,
                    'phone' => $store->phone,
                    'category' => $store->category,
                    'description' => $store->description,
                    'provinsi' => $store->provinsi,
                    'kota' => $store->kota,
                    'kecamatan' => $store->kecamatan,
                    'status' => $store->status,
                    'is_published' => $store->is_published,
                    'url' => 'https://' . $store->subdomain . '.aidareu.com'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete store
     */
    public function destroy(Request $request, $uuid)
    {
        try {
            $user = Auth::user();
            
            $store = Store::where('uuid', $uuid)
                ->where('user_id', $user->uuid)
                ->first();

            if (!$store) {
                return response()->json([
                    'message' => 'Store not found'
                ], 404);
            }

            $store->delete();

            return response()->json([
                'message' => 'Store deleted successfully!'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete store setup with all 3 steps
     */
    public function storeSetup(Request $request)
    {
        // Log request data for debugging
        Log::info('Store setup request data:', $request->all());
        
        $validator = Validator::make($request->all(), [
            // Store Info
            'storeName' => 'required|string|min:2|max:255',
            'subdomain' => [
                'required',
                'string',
                'min:3',
                'max:50',
                'regex:/^[a-z0-9-]+$/',
                'unique:stores,subdomain,NULL,id',
                'not_regex:/^(www|api|admin|app|mail|ftp|blog|shop|store|dashboard)$/i'
            ],
            'phoneNumber' => 'required|string|min:10|max:15',
            'category' => 'required|string',
            'description' => 'required|string|min:10',
            // Location
            'province' => 'required|string',
            'city' => 'required|string',
            'district' => 'required|string',
            // Bank Account
            'accountOwner' => 'required|string|min:2|max:255',
            'accountNumber' => 'required|string|min:8|max:20',
            'bankName' => 'required|string',
            // Social Media (optional)
            'instagram' => 'nullable|string',
            'facebook' => 'nullable|string',
            'tiktok' => 'nullable|string',
            'youtube' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            
            // Check if user already has a store
            $existingStore = Store::where('user_id', $user->uuid)->first();
            if ($existingStore) {
                return response()->json([
                    'message' => 'User already has a store',
                    'store' => $existingStore
                ], 400);
            }

            // Check subdomain availability
            $subdomain = strtolower($request->subdomain);
            
            // Log subdomain check
            Log::info('Checking subdomain availability: ' . $subdomain);
            
            if (Store::where('subdomain', $subdomain)->exists()) {
                Log::info('Subdomain is already taken: ' . $subdomain);
                return response()->json([
                    'message' => 'Subdomain is already taken'
                ], 400);
            }
            
            Log::info('Subdomain is available: ' . $subdomain);

            DB::beginTransaction();

            // Log store creation data
            Log::info('Creating store with data:', [
                'storeName' => $request->storeName,
                'subdomain' => $subdomain,
                'phoneNumber' => $request->phoneNumber,
                'category' => $request->category,
                'description' => $request->description,
                'user_id' => $user->uuid
            ]);
            
            // Map frontend category to database enum value
            $categoryMap = [
                'Produk Digital' => 'digital',
                'Fashion & Pakaian' => 'fashion',
                'Elektronik & Gadget' => 'elektronik',
                'Makanan & Minuman' => 'makanan',
                'Kesehatan & Kecantikan' => 'kesehatan',
                'Rumah & Taman' => 'rumah_tangga',
                'Olahraga & Outdoor' => 'olahraga',
                'Buku & Alat Tulis' => 'buku_media',
                'Mainan & Bayi' => 'mainan_hobi',
                'Otomotif' => 'otomotif',
                'Lainnya' => 'lainnya'
            ];
            
            $kategoriToko = $categoryMap[$request->category] ?? 'lainnya';
            
            // Create store
            $store = Store::create([
                'uuid' => Str::uuid(),
                'name' => $request->storeName,
                'subdomain' => $subdomain,
                'phone' => $request->phoneNumber,
                'category' => $kategoriToko,
                'description' => $request->description,
                'province' => $request->province,
                'city' => $request->city,
                'district' => $request->district,
                'user_id' => $user->uuid,
                'is_active' => true
            ]);

            // Create bank account if provided
            if ($request->accountOwner && $request->accountNumber && $request->bankName) {
                Log::info('Creating bank account', [
                    'store_uuid' => $store->uuid,
                    'account_owner' => $request->accountOwner,
                    'bank_name' => $request->bankName
                ]);

                $bankAccount = $store->bankAccounts()->create([
                    'uuid' => Str::uuid(),
                    'account_holder_name' => $request->accountOwner,
                    'account_number' => $request->accountNumber,
                    'bank_name' => $request->bankName,
                    'is_primary' => true,
                    'is_active' => true
                ]);

                Log::info('Bank account created', ['bank_account_id' => $bankAccount->id]);
            } else {
                Log::warning('Bank account data incomplete', [
                    'has_owner' => !empty($request->accountOwner),
                    'has_number' => !empty($request->accountNumber),
                    'has_bank' => !empty($request->bankName)
                ]);
            }

            // Create social media entry if provided
            if ($request->instagram || $request->facebook || $request->tiktok || $request->youtube) {
                Log::info('Creating social media', [
                    'store_uuid' => $store->uuid,
                    'has_instagram' => !empty($request->instagram),
                    'has_facebook' => !empty($request->facebook),
                    'has_tiktok' => !empty($request->tiktok),
                    'has_youtube' => !empty($request->youtube)
                ]);

                $socialMedia = $store->socialMedia()->create([
                    'uuid' => Str::uuid(),
                    'instagram_url' => $request->instagram,
                    'facebook_url' => $request->facebook,
                    'tiktok_url' => $request->tiktok,
                    'youtube_url' => $request->youtube,
                    'is_active' => true
                ]);

                Log::info('Social media created', ['social_media_id' => $socialMedia->id]);
            } else {
                Log::info('No social media data provided');
            }

            DB::commit();

            // Reload store with relationships to verify data was saved
            $store->load(['bankAccounts', 'socialMedia']);

            Log::info('Store setup completed successfully', [
                'store_id' => $store->id,
                'store_uuid' => $store->uuid,
                'bank_accounts_count' => $store->bankAccounts->count(),
                'social_media_count' => $store->socialMedia->count()
            ]);

            return response()->json([
                'message' => 'Store setup completed successfully!',
                'store' => [
                    'id' => $store->id,
                    'uuid' => $store->uuid,
                    'name' => $store->name,
                    'subdomain' => $store->subdomain,
                    'phone' => $store->phone,
                    'category' => $store->category,
                    'description' => $store->description,
                    'province' => $store->province,
                    'city' => $store->city,
                    'district' => $store->district,
                    'is_active' => $store->is_active,
                    'url' => 'https://' . $store->subdomain . '.aidareu.com',
                    'bank_accounts_count' => $store->bankAccounts->count(),
                    'social_media_count' => $store->socialMedia->count()
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Store setup error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to setup store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check user store status
     */
    public function checkUserStoreStatus()
    {
        try {
            $user = Auth::user();
            
            $store = Store::where('user_id', $user->uuid)->first();
            
            return response()->json([
                'has_store' => !is_null($store),
                'store_id' => $store ? $store->id : null,
                'store_uuid' => $store ? $store->uuid : null
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to check store status',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}