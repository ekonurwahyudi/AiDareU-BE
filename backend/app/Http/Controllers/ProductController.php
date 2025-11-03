<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Get authenticated user
            $user = null;
            if ($request->bearerToken()) {
                $user = auth('sanctum')->user();
            }
            if (!$user) {
                $user = auth('web')->user();
            }
            if (!$user && $request->header('X-User-UUID')) {
                $uuid = $request->header('X-User-UUID');
                $user = \App\Models\User::where('uuid', $uuid)->first();
            }

            // Check if user is superadmin
            $isSuperadmin = $user && $user->hasRole('superadmin');

            // Log for debugging
            \Log::info('ProductController@index', [
                'user_uuid' => $user ? $user->uuid : null,
                'user_roles' => $user ? $user->getRoleNames()->toArray() : [],
                'is_superadmin' => $isSuperadmin,
                'store_uuid_param' => $request->get('store_uuid'),
                'request_headers' => [
                    'Authorization' => $request->header('Authorization') ? 'present' : 'missing',
                    'X-User-UUID' => $request->header('X-User-UUID')
                ]
            ]);

            $query = Product::with(['category:id,judul_kategori', 'store:uuid,name'])
                ->select('id', 'uuid', 'nama_produk', 'deskripsi', 'harga_produk', 'harga_diskon', 'status_produk', 'jenis_produk', 'stock', 'category_id', 'uuid_store', 'upload_gambar_produk', 'created_at', 'url_produk');

            // Filter by store UUID
            if ($request->has('store_uuid')) {
                // Both superadmin and regular users: if store_uuid provided, filter by it
                $query->where('uuid_store', $request->store_uuid);
                \Log::info('Filtering products by store', ['uuid_store' => $request->store_uuid]);
            } elseif (!$isSuperadmin) {
                // Non-superadmin without store_uuid: should not happen, return empty
                return response()->json([
                    'status' => 'error',
                    'message' => 'Store UUID is required for non-superadmin users',
                    'data' => [
                        'data' => [],
                        'total' => 0
                    ]
                ], 400);
            }
            // Superadmin without store_uuid: show all products (no filter)

            // Filter by category
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status_produk', $request->status);
            }

            // Filter by product type
            if ($request->has('jenis_produk')) {
                $query->where('jenis_produk', $request->jenis_produk);
            }

            // Search by name
            if ($request->has('search')) {
                $query->where('nama_produk', 'LIKE', '%' . $request->search . '%');
            }

            $products = $query->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 10));

            return response()->json([
                'status' => 'success',
                'message' => 'Products retrieved successfully',
                'data' => $products
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|exists:stores,uuid',
                'nama_produk' => 'required|string|max:255',
                'deskripsi' => 'nullable|string',
                'jenis_produk' => 'required|in:digital,fisik',
                'url_produk' => 'nullable|required_if:jenis_produk,digital|url',
                'images' => 'nullable|array|max:10',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max per image
                'harga_produk' => 'required|numeric|min:0',
                'harga_diskon' => 'nullable|numeric|min:0|lt:harga_produk',
                'category_id' => 'required|exists:categories,id',
                'status_produk' => 'in:active,inactive,draft',
                'stock' => 'nullable|integer|min:0',
                'meta_description' => 'nullable|string|max:160',
                'meta_keywords' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Handle image uploads
            $imagePaths = [];
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $image) {
                    if ($index >= 10) break; // Limit to 10 images
                    
                    $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
                    $path = $image->storeAs('products', $filename, 'public');
                    $imagePaths[] = $path;
                }
            }

            $productData = $request->except(['images']);
            $productData['upload_gambar_produk'] = $imagePaths;
            
            // Set default stock for physical products
            if ($request->jenis_produk === 'fisik' && !$request->has('stock')) {
                $productData['stock'] = 0;
            }

            $product = Product::create($productData);
            $product->load(['category:id,judul_kategori', 'store:uuid,name']);

            return response()->json([
                'status' => 'success',
                'message' => 'Product created successfully',
                'data' => $product
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): JsonResponse
    {
        try {
            $product->load(['category:id,judul_kategori', 'store:uuid,name']);

            return response()->json([
                'status' => 'success',
                'message' => 'Product retrieved successfully',
                'data' => $product
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Product not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        try {
            // Log the incoming request for debugging
            Log::info('Product update request', [
                'product_id' => $product->id,
                'product_uuid' => $product->uuid,
                'method' => $request->method(),
                '_method' => $request->input('_method'),
                'data' => $request->except(['images'])
            ]);
            // Custom validation for discount price
            $rules = [
                'nama_produk' => 'sometimes|required|string|max:255',
                'deskripsi' => 'nullable|string',
                'jenis_produk' => 'sometimes|required|in:digital,fisik',
                'url_produk' => 'nullable|url',
                'images' => 'nullable|array|max:10',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
                'harga_produk' => 'sometimes|required|numeric|min:0',
                'harga_diskon' => 'nullable|numeric|min:0',
                'category_id' => 'sometimes|required|exists:categories,id',
                'status_produk' => 'sometimes|in:active,inactive,draft',
                'stock' => 'nullable|integer|min:0',
                'meta_description' => 'nullable|string|max:160',
                'meta_keywords' => 'nullable|string',
                '_method' => 'nullable|string' // Allow _method field
            ];

            $validator = Validator::make($request->all(), $rules);
            
            // Add custom validation for discount price
            $validator->after(function ($validator) use ($request) {
                if ($request->has('harga_diskon') && $request->has('harga_produk')) {
                    $discountPrice = $request->harga_diskon;
                    $regularPrice = $request->harga_produk;
                    
                    if ($discountPrice && $regularPrice && (float)$discountPrice >= (float)$regularPrice) {
                        $validator->errors()->add('harga_diskon', 'Harga diskon harus lebih kecil dari harga produk.');
                    }
                }
            });

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = $request->except(['images', '_method']);
            
            // Handle empty values that should be set to null
            if (array_key_exists('harga_diskon', $updateData) && $updateData['harga_diskon'] === '') {
                $updateData['harga_diskon'] = null;
            }
            if (array_key_exists('url_produk', $updateData) && $updateData['url_produk'] === '') {
                $updateData['url_produk'] = null;
            }
            if (array_key_exists('deskripsi', $updateData) && $updateData['deskripsi'] === '') {
                $updateData['deskripsi'] = null;
            }
            if (array_key_exists('stock', $updateData) && $updateData['stock'] === '') {
                $updateData['stock'] = 0;
            }
            
            // Handle new image uploads
            if ($request->hasFile('images')) {
                // Delete old images
                if ($product->upload_gambar_produk) {
                    foreach ($product->upload_gambar_produk as $oldImage) {
                        Storage::disk('public')->delete($oldImage);
                    }
                }

                $imagePaths = [];
                foreach ($request->file('images') as $index => $image) {
                    if ($index >= 10) break; // Limit to 10 images
                    
                    $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
                    $path = $image->storeAs('products', $filename, 'public');
                    $imagePaths[] = $path;
                }
                
                $updateData['upload_gambar_produk'] = $imagePaths;
            }

            $updated = $product->update($updateData);
            $product->load(['category:id,judul_kategori', 'store:uuid,name']);

            Log::info('Product update result', [
                'updated' => $updated,
                'product_after_update' => $product->fresh()->toArray()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Product updated successfully',
                'data' => $product->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product): JsonResponse
    {
        try {
            // Delete associated images
            if ($product->upload_gambar_produk) {
                foreach ($product->upload_gambar_produk as $image) {
                    Storage::disk('public')->delete($image);
                }
            }

            $product->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Product deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update product status
     */
    public function updateStatus(Request $request, Product $product): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status_produk' => 'required|in:active,inactive,draft'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $product->update(['status_produk' => $request->status_produk]);

            return response()->json([
                'status' => 'success',
                'message' => 'Product status updated successfully',
                'data' => $product->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update product status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update product stock
     */
    public function updateStock(Request $request, Product $product): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'stock' => 'required|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($product->jenis_produk !== 'fisik') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Stock can only be updated for physical products'
                ], 400);
            }

            $product->update(['stock' => $request->stock]);

            return response()->json([
                'status' => 'success',
                'message' => 'Product stock updated successfully',
                'data' => $product->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update product stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get products by store
     */
    public function getByStore(string $storeUuid): JsonResponse
    {
        try {
            $products = Product::where('uuid_store', $storeUuid)
                ->with(['category:id,judul_kategori', 'store:uuid,name'])
                ->active()
                ->orderBy('nama_produk', 'asc')
                ->paginate(10);

            return response()->json([
                'status' => 'success',
                'message' => 'Store products retrieved successfully',
                'data' => $products
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve store products',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}