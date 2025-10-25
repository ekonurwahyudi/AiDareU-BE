<?php

namespace App\Http\Controllers;

use App\Models\ProductDigital;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ProductDigitalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = ProductDigital::query();

        // Filter by category
        if ($request->has('kategori') && $request->kategori !== 'all') {
            $query->where('kategori', $request->kategori);
        }

        // Search by name or description
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('nama_produk', 'like', '%' . $request->search . '%')
                  ->orWhere('deskripsi', 'like', '%' . $request->search . '%');
            });
        }

        // Filter active only
        if ($request->has('active_only') && $request->active_only) {
            $query->active();
        }

        $products = $query->orderBy('created_at', 'desc')->get();

        // Add full URL for images
        $products->transform(function ($product) {
            if ($product->gambar && !filter_var($product->gambar, FILTER_VALIDATE_URL)) {
                $product->gambar = url('storage/' . $product->gambar);
            }
            return $product;
        });

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_produk' => 'required|string|max:255',
            'kategori' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'link_preview' => 'nullable|url',
            'link_download' => 'nullable|url',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except('gambar');

        // Handle image upload
        if ($request->hasFile('gambar')) {
            $image = $request->file('gambar');
            $path = $image->store('products-digital', 'public');
            $data['gambar'] = $path;
        }

        $product = ProductDigital::create($data);

        // Add full URL for image
        if ($product->gambar && !filter_var($product->gambar, FILTER_VALIDATE_URL)) {
            $product->gambar = url('storage/' . $product->gambar);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product digital created successfully',
            'data' => $product
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $uuid)
    {
        $product = ProductDigital::where('uuid', $uuid)->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        // Add full URL for image
        if ($product->gambar && !filter_var($product->gambar, FILTER_VALIDATE_URL)) {
            $product->gambar = url('storage/' . $product->gambar);
        }

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $uuid)
    {
        $product = ProductDigital::where('uuid', $uuid)->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_produk' => 'sometimes|required|string|max:255',
            'kategori' => 'sometimes|required|string|max:255',
            'deskripsi' => 'nullable|string',
            'link_preview' => 'nullable|url',
            'link_download' => 'nullable|url',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except('gambar');

        // Handle image upload
        if ($request->hasFile('gambar')) {
            // Delete old image
            if ($product->gambar && Storage::disk('public')->exists($product->gambar)) {
                Storage::disk('public')->delete($product->gambar);
            }

            $image = $request->file('gambar');
            $path = $image->store('products-digital', 'public');
            $data['gambar'] = $path;
        }

        $product->update($data);

        // Add full URL for image
        if ($product->gambar && !filter_var($product->gambar, FILTER_VALIDATE_URL)) {
            $product->gambar = url('storage/' . $product->gambar);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product digital updated successfully',
            'data' => $product
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $uuid)
    {
        $product = ProductDigital::where('uuid', $uuid)->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        // Delete image
        if ($product->gambar && Storage::disk('public')->exists($product->gambar)) {
            Storage::disk('public')->delete($product->gambar);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product digital deleted successfully'
        ]);
    }

    /**
     * Get unique categories
     */
    public function getCategories()
    {
        $categories = ProductDigital::select('kategori')
            ->distinct()
            ->orderBy('kategori')
            ->pluck('kategori');

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }
}
