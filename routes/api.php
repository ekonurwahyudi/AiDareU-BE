<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Api\LandingPageController;
use App\Http\Controllers\Api\RBACController;
use App\Http\Controllers\Api\SocialMediaController;
use App\Http\Controllers\Api\BankAccountController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\EditorImageController;
use App\Http\Controllers\ShippingController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Api\SettingTokoController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\ProductDigitalController;
use App\Http\Controllers\Api\NotificationController;

// Health check endpoint for monitoring
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API is working!',
        'timestamp' => now()->toIso8601String(),
        'version' => '1.0.0'
    ]);
});

// Test endpoint
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

// Test upload endpoint
Route::get('/test-upload', function () {
    return response()->json(['message' => 'Upload endpoint is accessible!']);
});

// Debug stores endpoint
Route::get('/debug/stores', function () {
    try {
        $user = \App\Models\User::where('uuid', 'e4fcfcba-63bc-41ff-a36c-11c6e57d16f8')->first();
        if (!$user) {
            return response()->json(['error' => 'User not found']);
        }
        
        $stores = \App\Models\Store::where('user_id', $user->uuid)->get();
        return response()->json([
            'user' => $user->uuid,
            'stores' => $stores
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()]);
    }
});

// Debug social media endpoint
Route::get('/debug/social-media', function () {
    try {
        $user = \App\Models\User::where('uuid', 'e4fcfcba-63bc-41ff-a36c-11c6e57d16f8')->first();
        if (!$user) {
            return response()->json(['error' => 'User not found']);
        }
        
        $store = \App\Models\Store::where('user_id', $user->uuid)->first();
        if (!$store) {
            return response()->json(['error' => 'Store not found']);
        }
        
        $socialMedia = \App\Models\SocialMedia::where('store_uuid', $store->uuid)->get();
        return response()->json([
            'user' => $user->uuid,
            'store' => $store->uuid,
            'social_media' => $socialMedia
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()]);
    }
});

// Debug bank accounts endpoint
Route::get('/debug/bank-accounts', function () {
    try {
        $user = \App\Models\User::where('uuid', 'e4fcfcba-63bc-41ff-a36c-11c6e57d16f8')->first();
        if (!$user) {
            return response()->json(['error' => 'User not found']);
        }
        
        $store = \App\Models\Store::where('user_id', $user->uuid)->first();
        if (!$store) {
            return response()->json(['error' => 'Store not found']);
        }
        
        $bankAccounts = \App\Models\BankAccount::where('store_uuid', $store->uuid)->get();
        return response()->json([
            'user' => $user->uuid,
            'store' => $store->uuid,
            'bank_accounts' => $bankAccounts
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()]);
    }
});

// Test registration endpoint
Route::post('/test-register', function (Request $request) {
    return response()->json([
        'message' => 'Test register endpoint working!',
        'data' => $request->all()
    ]);
});

// Public Auth Routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/auth/resend-verification', [AuthController::class, 'resendVerification']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// Public: Subdomain availability (no auth required)
Route::get('/stores/check-subdomain', [StoreController::class, 'checkSubdomain']);

// Public: Location API (no auth required)
Route::get('/locations/cities', [LocationController::class, 'getCities']);
Route::get('/locations/provinces', [LocationController::class, 'getProvinces']);

// Public: Image serving endpoint
Route::get('/storage/{path}', function ($path) {
    try {
        if (!Storage::disk('public')->exists($path)) {
            abort(404, 'Image not found');
        }
        
        $file = Storage::disk('public')->get($path);
        $fullPath = Storage::disk('public')->path($path);
        $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';
        
        return response($file)
            ->header('Content-Type', $mimeType)
            ->header('Cache-Control', 'public, max-age=86400')
            ->header('Access-Control-Allow-Origin', '*');
    } catch (\Exception $e) {
        abort(404, 'Image not found');
    }
})->where('path', '.*');

// Public: Categories API (no auth required)
Route::get('/public/categories', [CategoryController::class, 'getActiveCategories']);

// Public: Shipping API (no auth required)
Route::post('/shipping/calculate', [ShippingController::class, 'calculate']);

// Public: Bank Accounts API (no auth required) - for checkout flow
Route::get('/stores/{storeUuid}/bank-accounts', [BankAccountController::class, 'getByStore']);

// Public: Checkout API (no auth required)
Route::post('/checkout', [CheckoutController::class, 'processCheckout']);
Route::get('/order/{uuid}', [CheckoutController::class, 'getOrder']);
Route::get('/stores/{storeUuid}/orders', [CheckoutController::class, 'getStoreOrders']);
Route::put('/order/{uuid}/status', [CheckoutController::class, 'updateOrderStatus']);

// Public: Customer API (no auth required)
Route::get('/stores/{storeUuid}/customers', [CustomerController::class, 'index']);
Route::get('/customers/{uuid}', [CustomerController::class, 'show']);
Route::post('/customers', [CustomerController::class, 'store']);
Route::put('/customers/{uuid}', [CustomerController::class, 'update']);
Route::delete('/customers/{uuid}', [CustomerController::class, 'destroy']);

// Public: Products API (no auth required for testing)
Route::get('/public/products', [ProductController::class, 'index']);
Route::post('/public/products', [ProductController::class, 'store']);
Route::get('/public/products/{product}', [ProductController::class, 'show']);
Route::put('/public/products/{product}', [ProductController::class, 'update']);
Route::post('/public/products/{product}', [ProductController::class, 'update']); // Handle POST with _method=PUT
Route::delete('/public/products/{product}', [ProductController::class, 'destroy']);

// Public: Products Digital API (no auth required for testing)
Route::get('/public/products-digital', [ProductDigitalController::class, 'index']);
Route::get('/public/products-digital/categories', [ProductDigitalController::class, 'getCategories']);
Route::post('/public/products-digital', [ProductDigitalController::class, 'store']);
Route::get('/public/products-digital/{uuid}', [ProductDigitalController::class, 'show']);
Route::put('/public/products-digital/{uuid}', [ProductDigitalController::class, 'update']);
Route::post('/public/products-digital/{uuid}', [ProductDigitalController::class, 'update']); // Handle POST with _method=PUT
Route::delete('/public/products-digital/{uuid}', [ProductDigitalController::class, 'destroy']);

// Public: Editor Image Upload (no auth required for testing)
Route::post('/upload-editor-image', [EditorImageController::class, 'upload']);
Route::options('/upload-editor-image', function() {
    return response()->json(['status' => 'OK'])
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
});

// Public: User API for testing (no auth required)
Route::get('/users/me', [UserController::class, 'me']);
Route::put('/users/{uuid}', [UserController::class, 'update']);

// Public: Dashboard API for testing (no auth required)
Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
Route::get('/dashboard/revenue', [DashboardController::class, 'revenue']);
Route::get('/dashboard/popular-products', [DashboardController::class, 'popularProducts']);
Route::get('/dashboard/recent-orders', [DashboardController::class, 'recentOrders']);
Route::get('/dashboard/customers', [DashboardController::class, 'customers']);

// Public: Notification API (no auth required for testing)
Route::get('/notifications/orders', [NotificationController::class, 'getOrderNotifications']);
Route::post('/notifications/orders/{orderUuid}/read', [NotificationController::class, 'markAsRead']);

// Public: Alternative API endpoints for frontend (no auth required)
Route::get('/public/stores', [\App\Http\Controllers\StoreController::class, 'index']);

// Frontend-expected endpoints (for authenticated use)
Route::get('/stores', [\App\Http\Controllers\StoreController::class, 'index']);
Route::get('/pixel-stores', [\App\Http\Controllers\Api\PixelStoreController::class, 'index']);
Route::get('/landing-pages/{id}', [LandingPageController::class, 'showById']);
Route::get('/public/social-media', [\App\Http\Controllers\Api\SocialMediaController::class, 'userIndex']);
Route::get('/public/bank-accounts', [\App\Http\Controllers\Api\BankAccountController::class, 'userIndex']);
Route::post('/public/social-media', [\App\Http\Controllers\Api\SocialMediaController::class, 'userStore']);
Route::put('/public/social-media/{socialMedia}', [\App\Http\Controllers\Api\SocialMediaController::class, 'userUpdate']);
Route::post('/public/bank-accounts', [\App\Http\Controllers\Api\BankAccountController::class, 'userStore']);
Route::put('/public/bank-accounts/{bankAccount}', [\App\Http\Controllers\Api\BankAccountController::class, 'userUpdate']);
Route::delete('/public/bank-accounts/{bankAccount}', [\App\Http\Controllers\Api\BankAccountController::class, 'userDestroy']);

// Public: Pixel Store API (no auth required)
Route::get('/public/pixel-stores', [\App\Http\Controllers\Api\PixelStoreController::class, 'index']);
Route::post('/public/pixel-stores', [\App\Http\Controllers\Api\PixelStoreController::class, 'store']);
Route::put('/public/pixel-stores/{pixelUuid}', [\App\Http\Controllers\Api\PixelStoreController::class, 'update']);
Route::delete('/public/pixel-stores/{pixelUuid}', [\App\Http\Controllers\Api\PixelStoreController::class, 'destroy']);
Route::put('/public/stores/{uuid}', [\App\Http\Controllers\StoreController::class, 'update']);

// Auth (session-based) - Legacy
Route::middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('api.login');
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
});

// Authenticated routes (with development fallback)
Route::middleware(['auth:sanctum,web'])->group(function () {
    // User info
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    
    // Legacy user route
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // User management routes
    Route::prefix('users')->group(function () {
        Route::get('/{uuid}', [UserController::class, 'show']);
    });

    // User store status
    Route::get('/user/store-status', [StoreController::class, 'checkUserStoreStatus']);
    
    // Store setup
    Route::post('/check-subdomain', [StoreController::class, 'checkSubdomain']);
    Route::post('/store/setup', [StoreController::class, 'storeSetup']);

    // RBAC Routes
    Route::prefix('rbac')->group(function () {
        // Users
        Route::get('/users', [RBACController::class, 'getUsers']);
        Route::post('/users', [RBACController::class, 'createUser']);
        Route::put('/users/{id}', [RBACController::class, 'updateUser']);
        Route::put('/users/{id}/toggle-status', [RBACController::class, 'toggleUserStatus']);
        Route::delete('/users/{id}', [RBACController::class, 'deleteUser']);
        Route::post('/assign-roles', [RBACController::class, 'assignRoles']);
        
        // Roles & Permissions
        Route::get('/roles', [RBACController::class, 'getRoles']);
        Route::get('/permissions', [RBACController::class, 'getPermissions']);
        Route::get('/permissions/me', [RBACController::class, 'myPermissions']);
    });

    // Store Routes
    Route::prefix('stores')->group(function () {
        Route::get('/test', [StoreController::class, 'test']);
        Route::get('/', [StoreController::class, 'index']);
        Route::post('/', [StoreController::class, 'store']);
        // Removed GET /stores/check-subdomain from protected routes (now public above)
        Route::get('/{uuid}', [StoreController::class, 'show']);
        Route::put('/{uuid}', [StoreController::class, 'update']);
        Route::delete('/{uuid}', [StoreController::class, 'destroy']);
    });
    
    // Social Media Routes
    Route::prefix('stores/{store}/social-media')->group(function () {
        Route::get('/', [SocialMediaController::class, 'index']);
        Route::post('/', [SocialMediaController::class, 'store']);
        Route::put('/{socialMedia}', [SocialMediaController::class, 'update']);
        Route::delete('/{socialMedia}', [SocialMediaController::class, 'destroy']);
        Route::post('/bulk-update', [SocialMediaController::class, 'bulkUpdate']);
    });
    
    // Bank Account Routes
    Route::prefix('stores/{store}/bank-accounts')->group(function () {
        Route::get('/', [BankAccountController::class, 'index']);
        Route::post('/', [BankAccountController::class, 'store']);
        Route::put('/{bankAccount}', [BankAccountController::class, 'update']);
        Route::delete('/{bankAccount}', [BankAccountController::class, 'destroy']);
        Route::post('/{bankAccount}/set-primary', [BankAccountController::class, 'setPrimary']);
    });
    
    // Direct routes for current user's store (simpler for frontend)
    Route::get('/social-media', [SocialMediaController::class, 'userIndex']);
    Route::post('/social-media', [SocialMediaController::class, 'userStore']);
    Route::put('/social-media/{socialMedia}', [SocialMediaController::class, 'userUpdate']);
    Route::delete('/social-media/{socialMedia}', [SocialMediaController::class, 'userDestroy']);
    
    Route::get('/bank-accounts', [BankAccountController::class, 'userIndex']);
    Route::post('/bank-accounts', [BankAccountController::class, 'userStore']);
    Route::put('/bank-accounts/{bankAccount}', [BankAccountController::class, 'userUpdate']);
    Route::delete('/bank-accounts/{bankAccount}', [BankAccountController::class, 'userDestroy']);

    // Utility Routes
    Route::get('/social-media/platforms', [SocialMediaController::class, 'getPlatforms']);
    Route::get('/bank-accounts/banks', [BankAccountController::class, 'getBanks']);
    
    // Category Routes
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::post('/', [CategoryController::class, 'store']);
        Route::get('/active', [CategoryController::class, 'getActiveCategories']);
        Route::get('/search', [CategoryController::class, 'search']);
        Route::get('/{category}', [CategoryController::class, 'show']);
        Route::put('/{category}', [CategoryController::class, 'update']);
        Route::delete('/{category}', [CategoryController::class, 'destroy']);
        Route::patch('/{category}/toggle-status', [CategoryController::class, 'toggleStatus']);
    });
    
    // Product Routes
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);
        Route::get('/store/{storeUuid}', [ProductController::class, 'getByStore']);
        Route::get('/{product}', [ProductController::class, 'show']);
        Route::put('/{product}', [ProductController::class, 'update']);
        Route::delete('/{product}', [ProductController::class, 'destroy']);
        Route::patch('/{product}/status', [ProductController::class, 'updateStatus']);
        Route::patch('/{product}/stock', [ProductController::class, 'updateStock']);
    });
    

    // Landing Page Routes
    Route::post('/generate-landing', [LandingPageController::class, 'generate']);
    Route::post('/landing', [LandingPageController::class, 'store']);
    Route::get('/landing', [LandingPageController::class, 'index']);
    Route::get('/test-openai', [LandingPageController::class, 'testOpenAI']);
    
    Route::post('/landing/{landing}/update', [LandingPageController::class, 'update']);
    Route::get('/landing/{landing}', [LandingPageController::class, 'showById']);
    Route::delete('/landing/{landing}', [LandingPageController::class, 'destroy']);
    Route::post('/landing/{landing}/duplicate', [LandingPageController::class, 'duplicate']);

    Route::get('/landing/uuid/{uuid}', [LandingPageController::class, 'showByUuid']);
    Route::post('/landing/uuid/{uuid}/update', [LandingPageController::class, 'updateByUuid']);
    Route::delete('/landing/uuid/{uuid}', [LandingPageController::class, 'destroyByUuid']);
    Route::post('/landing/uuid/{uuid}/duplicate', [LandingPageController::class, 'duplicateByUuid']);
    Route::get('/landing/uuid/{uuid}/images', [LandingPageController::class, 'getConsistentImages']);
});

// Public
Route::get('/landing/slug/{slug}', [LandingPageController::class, 'showBySlug']);

// Public: Theme Settings API (no auth required for public store view)
Route::get('/theme-settings', [SettingTokoController::class, 'index']);

// Public: Get store by subdomain with all data
Route::get('/store/{subdomain}', [SettingTokoController::class, 'getStoreBySubdomain']);

// Protected: Theme Settings Management
Route::middleware(['auth:sanctum,web'])->group(function () {
    Route::post('/theme-settings/general', [SettingTokoController::class, 'updateGeneral']);
    Route::post('/theme-settings/slides', [SettingTokoController::class, 'updateSlides']);
    Route::post('/theme-settings/faq', [SettingTokoController::class, 'createFaq']);
    Route::put('/theme-settings/faq/{uuid}', [SettingTokoController::class, 'updateFaq']);
    Route::delete('/theme-settings/faq/{uuid}', [SettingTokoController::class, 'deleteFaq']);
    Route::post('/theme-settings/testimonial', [SettingTokoController::class, 'createTestimonial']);
    Route::put('/theme-settings/testimonial/{uuid}', [SettingTokoController::class, 'updateTestimonial']);
    Route::delete('/theme-settings/testimonial/{uuid}', [SettingTokoController::class, 'deleteTestimonial']);
    Route::post('/theme-settings/seo', [SettingTokoController::class, 'updateSeo']);
});