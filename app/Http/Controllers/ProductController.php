<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductVariantOption;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
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

            $query = Product::with(['category:id,judul_kategori', 'store:uuid,name', 'variants.options'])
                ->select('id', 'uuid', 'nama_produk', 'deskripsi', 'harga_produk', 'harga_diskon', 'status_produk', 'jenis_produk', 'stock', 'category_id', 'uuid_store', 'upload_gambar_produk', 'size_guide_image', 'berat_produk', 'created_at', 'url_produk');

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

            // Get pagination parameters
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);

            \Log::info('Product pagination', [
                'per_page' => $perPage,
                'page' => $page,
                'request_params' => $request->all()
            ]);

            $products = $query->orderBy('created_at', 'desc')
                ->paginate($perPage);

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
                'jenis_produk' => 'required|in:digital,fisik,affiliate,jasa',
                'url_produk' => 'nullable|required_if:jenis_produk,digital|required_if:jenis_produk,affiliate|url',
                'images' => 'nullable|array|max:10',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp,svg,bmp,avif|max:5120', // 5MB max per image
                'harga_produk' => 'required|numeric|min:0',
                'harga_diskon' => 'nullable|numeric|min:0|lt:harga_produk',
                'category_id' => 'required|exists:categories,id',
                'status_produk' => 'in:active,inactive,draft',
                'stock' => 'nullable|integer|min:0',
                'meta_description' => 'nullable|string|max:160',
                'meta_keywords' => 'nullable|string',
                'berat_produk' => 'nullable|integer|min:1',
                'size_guide_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
                'variants' => 'nullable|array',
                'variants.*.variant_name' => 'required|string|max:255',
                'variants.*.options' => 'required|array|min:1',
                'variants.*.options.*.option_name' => 'required|string|max:255',
                'variants.*.options.*.harga' => 'nullable|numeric|min:0',
                'variants.*.options.*.stock' => 'nullable|integer|min:0',
            ], [
                // Store validation messages
                'uuid_store.required' => 'Toko harus dipilih',
                'uuid_store.exists' => 'Toko yang dipilih tidak valid',

                // Product name validation messages
                'nama_produk.required' => 'Nama produk harus diisi',
                'nama_produk.max' => 'Nama produk maksimal 255 karakter',

                // Product type validation messages
                'jenis_produk.required' => 'Jenis produk harus dipilih',
                'jenis_produk.in' => 'Jenis produk tidak valid. Pilih: Digital, Fisik, Affiliate, atau Jasa',

                // URL validation messages
                'url_produk.required_if' => 'URL produk wajib diisi untuk produk digital dan affiliate',
                'url_produk.url' => 'Format URL tidak valid. Contoh: https://example.com',

                // Images validation messages
                'images.max' => 'Maksimal 10 gambar yang bisa diupload',
                'images.*.image' => 'File harus berupa gambar',
                'images.*.mimes' => 'Format gambar harus JPG, PNG, GIF, WebP, SVG, BMP, atau AVIF',
                'images.*.max' => 'Ukuran gambar maksimal 5 MB',

                // Price validation messages
                'harga_produk.required' => 'Harga produk harus diisi',
                'harga_produk.numeric' => 'Harga produk harus berupa angka',
                'harga_produk.min' => 'Harga produk tidak boleh negatif',

                // Discount price validation messages
                'harga_diskon.numeric' => 'Harga diskon harus berupa angka',
                'harga_diskon.min' => 'Harga diskon tidak boleh negatif',
                'harga_diskon.lt' => 'Harga diskon harus lebih kecil dari harga produk',

                // Category validation messages
                'category_id.required' => 'Kategori produk harus dipilih',
                'category_id.exists' => 'Kategori yang dipilih tidak valid',

                // Status validation messages
                'status_produk.in' => 'Status produk tidak valid. Pilih: Aktif, Tidak Aktif, atau Draft',

                // Stock validation messages
                'stock.integer' => 'Stok harus berupa angka bulat',
                'stock.min' => 'Stok tidak boleh negatif',

                // Weight validation messages
                'berat_produk.integer' => 'Berat produk harus berupa angka bulat (dalam gram)',
                'berat_produk.min' => 'Berat produk minimal 1 gram',

                // Size guide validation messages
                'size_guide_image.image' => 'File panduan ukuran harus berupa gambar',
                'size_guide_image.mimes' => 'Format gambar panduan ukuran harus JPG, PNG, atau GIF',
                'size_guide_image.max' => 'Ukuran gambar panduan ukuran maksimal 5 MB',

                // Variant validation messages
                'variants.*.variant_name.required' => 'Nama varian harus diisi',
                'variants.*.variant_name.max' => 'Nama varian maksimal 255 karakter',
                'variants.*.options.required' => 'Opsi varian harus diisi',
                'variants.*.options.min' => 'Minimal 1 opsi varian harus ditambahkan',
                'variants.*.options.*.option_name.required' => 'Nama opsi varian harus diisi',
                'variants.*.options.*.option_name.max' => 'Nama opsi varian maksimal 255 karakter',
                'variants.*.options.*.harga.numeric' => 'Harga varian harus berupa angka',
                'variants.*.options.*.harga.min' => 'Harga varian tidak boleh negatif',
                'variants.*.options.*.stock.integer' => 'Stok varian harus berupa angka bulat',
                'variants.*.options.*.stock.min' => 'Stok varian tidak boleh negatif',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal. Mohon periksa kembali data yang Anda masukkan.',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Handle product image uploads
                $imagePaths = [];
                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $index => $image) {
                        if ($index >= 10) break; // Limit to 10 images

                        $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
                        $path = $image->storeAs('products', $filename, 'public');
                        $imagePaths[] = $path;
                    }
                }

                // Handle size guide image upload
                $sizeGuidePath = null;
                if ($request->hasFile('size_guide_image')) {
                    $sizeGuideFile = $request->file('size_guide_image');
                    $filename = 'size-guide-' . Str::uuid() . '.' . $sizeGuideFile->getClientOriginalExtension();
                    $sizeGuidePath = $sizeGuideFile->storeAs('size-guides', $filename, 'public');
                }

                $productData = $request->except(['images', 'size_guide_image', 'variants']);
                $productData['upload_gambar_produk'] = $imagePaths;
                $productData['size_guide_image'] = $sizeGuidePath;

                // Set default berat if not provided
                if (!$request->has('berat_produk')) {
                    $productData['berat_produk'] = 1000; // Default 1kg
                }

                // Set default stock for physical products
                if ($request->jenis_produk === 'fisik' && !$request->has('stock')) {
                    $productData['stock'] = 0;
                }

                // Create product
                $product = Product::create($productData);

                // Handle variants if provided
                if ($request->has('variants') && is_array($request->variants)) {
                    foreach ($request->variants as $variantData) {
                        $variant = ProductVariant::create([
                            'product_uuid' => $product->uuid,
                            'variant_name' => $variantData['variant_name']
                        ]);

                        // Create variant options
                        if (isset($variantData['options']) && is_array($variantData['options'])) {
                            foreach ($variantData['options'] as $optionData) {
                                ProductVariantOption::create([
                                    'variant_uuid' => $variant->uuid,
                                    'option_name' => $optionData['option_name'],
                                    'harga' => $optionData['harga'] ?? null,
                                    'stock' => $optionData['stock'] ?? 0,
                                ]);
                            }
                        }
                    }
                }

                DB::commit();

                $product->load(['category:id,judul_kategori', 'store:uuid,name', 'variants.options']);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Product created successfully',
                    'data' => $product
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();

                // Clean up uploaded files on error
                if (!empty($imagePaths)) {
                    foreach ($imagePaths as $path) {
                        Storage::disk('public')->delete($path);
                    }
                }
                if ($sizeGuidePath) {
                    Storage::disk('public')->delete($sizeGuidePath);
                }

                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat produk. Silakan coba lagi.',
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
            $product->load(['category:id,judul_kategori', 'store:uuid,name', 'variants.options']);

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
                'jenis_produk' => 'sometimes|required|in:digital,fisik,affiliate,jasa',
                'url_produk' => 'nullable|url',
                'images' => 'nullable|array|max:10',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp,svg,bmp,avif|max:5120',
                'harga_produk' => 'sometimes|required|numeric|min:0',
                'harga_diskon' => 'nullable|numeric|min:0',
                'category_id' => 'sometimes|required|exists:categories,id',
                'status_produk' => 'sometimes|in:active,inactive,draft',
                'stock' => 'nullable|integer|min:0',
                'meta_description' => 'nullable|string|max:160',
                'meta_keywords' => 'nullable|string',
                'berat_produk' => 'nullable|integer|min:1',
                'size_guide_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
                '_method' => 'nullable|string' // Allow _method field
            ];

            $messages = [
                // Product name validation messages
                'nama_produk.required' => 'Nama produk harus diisi',
                'nama_produk.max' => 'Nama produk maksimal 255 karakter',

                // Product type validation messages
                'jenis_produk.required' => 'Jenis produk harus dipilih',
                'jenis_produk.in' => 'Jenis produk tidak valid. Pilih: Digital, Fisik, Affiliate, atau Jasa',

                // URL validation messages
                'url_produk.url' => 'Format URL tidak valid. Contoh: https://example.com',

                // Images validation messages
                'images.max' => 'Maksimal 10 gambar yang bisa diupload',
                'images.*.image' => 'File harus berupa gambar',
                'images.*.mimes' => 'Format gambar harus JPG, PNG, GIF, WebP, SVG, BMP, atau AVIF',
                'images.*.max' => 'Ukuran gambar maksimal 5 MB',

                // Price validation messages
                'harga_produk.required' => 'Harga produk harus diisi',
                'harga_produk.numeric' => 'Harga produk harus berupa angka',
                'harga_produk.min' => 'Harga produk tidak boleh negatif',

                // Discount price validation messages
                'harga_diskon.numeric' => 'Harga diskon harus berupa angka',
                'harga_diskon.min' => 'Harga diskon tidak boleh negatif',

                // Category validation messages
                'category_id.required' => 'Kategori produk harus dipilih',
                'category_id.exists' => 'Kategori yang dipilih tidak valid',

                // Status validation messages
                'status_produk.in' => 'Status produk tidak valid. Pilih: Aktif, Tidak Aktif, atau Draft',

                // Stock validation messages
                'stock.integer' => 'Stok harus berupa angka bulat',
                'stock.min' => 'Stok tidak boleh negatif',

                // Weight validation messages
                'berat_produk.integer' => 'Berat produk harus berupa angka bulat (dalam gram)',
                'berat_produk.min' => 'Berat produk minimal 1 gram',

                // Size guide validation messages
                'size_guide_image.image' => 'File panduan ukuran harus berupa gambar',
                'size_guide_image.mimes' => 'Format gambar panduan ukuran harus JPG, PNG, atau GIF',
                'size_guide_image.max' => 'Ukuran gambar panduan ukuran maksimal 5 MB',
            ];

            $validator = Validator::make($request->all(), $rules, $messages);

            // Add custom validation for discount price
            $validator->after(function ($validator) use ($request) {
                if ($request->has('harga_diskon') && $request->has('harga_produk')) {
                    $discountPrice = $request->harga_diskon;
                    $regularPrice = $request->harga_produk;

                    if ($discountPrice && $regularPrice && (float)$discountPrice >= (float)$regularPrice) {
                        $validator->errors()->add('harga_diskon', 'Harga diskon harus lebih kecil dari harga produk');
                    }
                }
            });

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal. Mohon periksa kembali data yang Anda masukkan.',
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