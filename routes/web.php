<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LandingPageController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Log;

// CRITICAL: Storage route handler
// This closure will be used for storage routes below
$storageHandler = function ($path) {
    try {
        // Decode URL-encoded path
        $path = urldecode($path);

        // Security: prevent directory traversal
        if (strpos($path, '..') !== false) {
            \Log::warning('Directory traversal attempt', ['path' => $path]);
            abort(403, 'Forbidden');
        }

        // Log the request for debugging
        \Log::info('Storage request', [
            'path' => $path,
            'exists' => Storage::disk('public')->exists($path),
            'full_path' => Storage::disk('public')->path($path)
        ]);

        if (!Storage::disk('public')->exists($path)) {
            \Log::warning('Storage file not found', [
                'path' => $path,
                'checked_path' => storage_path('app/public/' . $path)
            ]);
            abort(404, 'File not found');
        }

        $fullPath = Storage::disk('public')->path($path);

        // Get file size and MIME type
        $fileSize = filesize($fullPath);
        $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';

        // Get file content
        $file = Storage::disk('public')->get($path);

        // Return response with proper headers
        return Response::make($file, 200, [
            'Content-Type' => $mimeType,
            'Content-Length' => $fileSize,
            'Cache-Control' => 'public, max-age=86400', // Cache for 24 hours
            'X-Content-Type-Options' => 'nosniff',
        ]);
    } catch (\Exception $e) {
        \Log::error('Storage handler error', [
            'path' => $path,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        abort(500, 'Internal Server Error');
    }
};

// PRIORITY 1: Storage route - MUST be registered BEFORE any catch-all routes
// Works on ALL domains (main domain, subdomains, custom domains)
// Accessible at: https://api.aidareu.com/storage/{path}
// CORS is handled by HandleCors middleware via config/cors.php
Route::get('/storage/{path}', $storageHandler)->where('path', '.*');

// Main domain routes (when no subdomain/custom domain)
Route::domain(config('app.domain', 'localhost'))->group(function () use ($storageHandler) {
    // Storage route for main domain
    Route::get('/storage/{path}', $storageHandler)->where('path', '.*');

    Route::get('/', function () {
        return view('welcome');
    });

    // Route untuk menampilkan landing page yang di-generate
    Route::get('/{slug}', [LandingPageController::class, 'showBySlug'])
        ->where('slug', '[a-zA-Z0-9\-_]+');

    // Route untuk menampilkan landing page berdasarkan UUID
    Route::get('/uuid/{uuid}', [LandingPageController::class, 'showByUuid'])
        ->where('uuid', '[a-fA-F0-9\-]+');
});

// Tenant routes (for subdomains and custom domains)
// These will be handled by SubdomainMiddleware and CustomDomainMiddleware
Route::middleware(['web'])->group(function () use ($storageHandler) {
    // Storage route for tenant domains/subdomains - MUST be first in this group
    Route::get('/storage/{path}', $storageHandler)->where('path', '.*');

    // Home page for tenant
    Route::get('/', [TenantController::class, 'showLandingPage']);

    // Dynamic tenant routes
    // NOTE: Storage is handled above, so this won't catch /storage/* paths
    Route::get('/{path}', [TenantController::class, 'handleDynamicRoute'])
        ->where('path', '[a-zA-Z0-9\-_/]+');
});
