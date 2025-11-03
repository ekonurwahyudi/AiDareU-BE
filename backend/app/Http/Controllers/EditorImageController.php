<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EditorImageController extends Controller
{
    /**
     * Upload image for rich text editor
     */
    public function upload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120' // 5MB max
            ]);

            $image = $request->file('image');

            // Generate unique filename
            $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();

            // Store in editor-images directory
            $path = $image->storeAs('editor-images', $filename, 'public');

            // Generate full URL - use the API URL pattern like the storage route
            $url = url('api/storage/' . $path);

            $response = response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully',
                'url' => $url,
                'path' => $path
            ]);

            // Add CORS headers
            $response->header('Access-Control-Allow-Origin', '*');
            $response->header('Access-Control-Allow-Methods', 'POST, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');

            return $response;

        } catch (\Exception $e) {
            $response = response()->json([
                'success' => false,
                'message' => 'Failed to upload image',
                'error' => $e->getMessage()
            ], 500);

            // Add CORS headers to error response too
            $response->header('Access-Control-Allow-Origin', '*');
            $response->header('Access-Control-Allow-Methods', 'POST, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');

            return $response;
        }
    }
}