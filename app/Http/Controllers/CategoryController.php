<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index(): JsonResponse
    {
        try {
            $categories = Category::orderBy('judul_kategori', 'asc')
                ->paginate(10);

            return response()->json([
                'status' => 'success',
                'message' => 'Categories retrieved successfully',
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve categories: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data kategori. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Get all active categories (for dropdown/select)
     */
    public function getActiveCategories(): JsonResponse
    {
        try {
            $categories = Category::active()
                ->select('id', 'uuid', 'judul_kategori')
                ->orderBy('judul_kategori', 'asc')
                ->get();

            return response()->json([
                'status' => 'success',
                'message' => 'Active categories retrieved successfully',
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve active categories: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil kategori aktif. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'judul_kategori' => 'required|string|max:255|unique:categories,judul_kategori',
                'deskripsi_kategori' => 'nullable|string',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $category = Category::create($request->all());

            return response()->json([
                'status' => 'success',
                'message' => 'Category created successfully',
                'data' => $category
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create category: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat kategori. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category): JsonResponse
    {
        try {
            $category->load(['products' => function ($query) {
                $query->select('id', 'uuid', 'nama_produk', 'harga_produk', 'status_produk', 'category_id')
                      ->orderBy('nama_produk', 'asc');
            }]);

            return response()->json([
                'status' => 'success',
                'message' => 'Category retrieved successfully',
                'data' => $category
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kategori tidak ditemukan'
            ], 404);
        }
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'judul_kategori' => 'required|string|max:255|unique:categories,judul_kategori,' . $category->id,
                'deskripsi_kategori' => 'nullable|string',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $category->update($request->all());

            return response()->json([
                'status' => 'success',
                'message' => 'Category updated successfully',
                'data' => $category->fresh()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update category: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengupdate kategori. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Category $category): JsonResponse
    {
        try {
            // Check if category has products
            if ($category->products()->count() > 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot delete category with associated products'
                ], 400);
            }

            $category->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Category deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete category: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus kategori. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Toggle category status (active/inactive)
     */
    public function toggleStatus(Category $category): JsonResponse
    {
        try {
            $category->update(['is_active' => !$category->is_active]);

            return response()->json([
                'status' => 'success',
                'message' => 'Category status updated successfully',
                'data' => $category->fresh()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update category status: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengupdate status kategori. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Search categories
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $query = $request->get('query');
            
            $categories = Category::where('judul_kategori', 'LIKE', "%{$query}%")
                ->orWhere('deskripsi_kategori', 'LIKE', "%{$query}%")
                ->orderBy('judul_kategori', 'asc')
                ->paginate(10);

            return response()->json([
                'status' => 'success',
                'message' => 'Search results retrieved successfully',
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            Log::error('Search failed: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Pencarian gagal. Silakan coba lagi.'
            ], 500);
        }
    }
}