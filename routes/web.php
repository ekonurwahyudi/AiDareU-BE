<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LandingPageController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;

// Handle OPTIONS preflight for storage route
Route::options('/storage/{path}', function () {
    $origin = request()->header('Origin');
    $allowedOrigins = [
        'https://aidareu.com',
        'https://www.aidareu.com',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:8080',
    ];

    $headers = [];
    if (in_array($origin, $allowedOrigins) || str_ends_with($origin ?? '', '.aidareu.com')) {
        $headers['Access-Control-Allow-Origin'] = $origin;
        $headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
        $headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
        $headers['Access-Control-Allow-Credentials'] = 'true';
        $headers['Access-Control-Max-Age'] = '86400';
    }

    return response('', 200, $headers);
})->where('path', '.*');

// Storage route to serve uploaded files when symbolic link doesn't work
Route::get('/storage/{path}', function ($path) {
    if (!Storage::disk('public')->exists($path)) {
        abort(404, 'File not found');
    }

    $file = Storage::disk('public')->get($path);
    $fullPath = Storage::disk('public')->path($path);
    $type = mime_content_type($fullPath) ?: 'application/octet-stream';

    // Get origin and add CORS headers
    $origin = request()->header('Origin');
    $allowedOrigins = [
        'https://aidareu.com',
        'https://www.aidareu.com',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:8080',
    ];

    $headers = [
        'Content-Type' => $type,
        'Cache-Control' => 'public, max-age=86400',
    ];

    if (in_array($origin, $allowedOrigins) || str_ends_with($origin ?? '', '.aidareu.com')) {
        $headers['Access-Control-Allow-Origin'] = $origin;
        $headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
        $headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
        $headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return Response::make($file, 200, $headers);
})->where('path', '.*');

// Main domain routes (when no subdomain/custom domain)
Route::domain(config('app.domain', 'localhost'))->group(function () {
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
Route::middleware(['web'])->group(function () {
    // Home page for tenant
    Route::get('/', [TenantController::class, 'showLandingPage']);
    
    // Dynamic tenant routes
    Route::get('/{path}', [TenantController::class, 'handleDynamicRoute'])
        ->where('path', '[a-zA-Z0-9\-_/]+');
});
