<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LandingPageController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;

// Storage route to serve uploaded files when symbolic link doesn't work
Route::get('/storage/{path}', function ($path) {
    if (!Storage::disk('public')->exists($path)) {
        abort(404, 'File not found');
    }
    
    $file = Storage::disk('public')->get($path);
    $fullPath = Storage::disk('public')->path($path);
    $type = mime_content_type($fullPath) ?: 'application/octet-stream';
    
    return Response::make($file, 200, [
        'Content-Type' => $type,
        'Cache-Control' => 'public, max-age=86400', // Cache for 24 hours
    ]);
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
