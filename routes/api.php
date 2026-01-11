<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
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
use App\Http\Controllers\Api\CustomerManagementController;
use App\Http\Controllers\Api\UserManagementController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\ProductDigitalController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\AIProductPhotoController;
use App\Http\Controllers\AIMergePhotoController;
use App\Http\Controllers\AIFashionPhotoController;
use App\Http\Controllers\CoinTransactionController;

/*
|--------------------------------------------------------------------------
| SECURITY: Rate Limiting Applied
|--------------------------------------------------------------------------
| - auth: 5 requests/minute (login, register, password reset)
| - api: 60 requests/minute (general API)
| - payment: 10 requests/minute (payment endpoints)
| - ai-generation: 20 requests/minute (AI endpoints)
| - upload: 30 requests/minute (file uploads)
| - otp: 5 requests/10 minutes (verification codes)
|--------------------------------------------------------------------------
*/

// ============================================================================
// HEALTH CHECK & PUBLIC ENDPOINTS (Rate Limited)
// ============================================================================

// Health check endpoint for monitoring
Route::middleware('throttle:api')->get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API is working!',
        'timestamp' => now()->toIso8601String(),
        'version' => '1.0.0'
    ]);
});

// Test endpoint (rate limited)
Route::middleware('throttle:api')->get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

// Test CORS endpoint (rate limited)
Route::middleware('throttle:api')->get('/test-cors', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'CORS is working!',
        'headers' => [
            'origin' => request()->header('Origin'),
            'referer' => request()->header('Referer'),
            'host' => request()->header('Host')
        ],
        'timestamp' => now()->toIso8601String()
    ]);
});

// ============================================================================
// PAYMENT CALLBACKS (Public but Rate Limited)
// ============================================================================

// Duitku Payment Callback (public endpoint - no auth required, but rate limited)
Route::middleware('throttle:payment-callback')
    ->post('/payment/duitku/callback', [\App\Http\Controllers\Api\DuitkuController::class, 'handleCallback']);

// ============================================================================
// DEBUG ENDPOINTS - DISABLED IN PRODUCTION
// ============================================================================
// SECURITY: Debug endpoints removed for production security
// If needed for development, uncomment and protect with admin middleware

/*
// DEBUG ENDPOINTS - ONLY FOR DEVELOPMENT
if (app()->environment('local', 'development')) {
    Route::middleware(['throttle:api'])->group(function () {
        Route::get('/debug/stores', function () { ... });
        Route::get('/debug/social-media', function () { ... });
        Route::get('/debug/bank-accounts', function () { ... });
        Route::get('/test-db', function () { ... });
    });
}
*/

// ============================================================================
// TEST SESSION ENDPOINT (Development Only)
// ============================================================================
Route::middleware(['web', 'throttle:api'])->get('/test-session', function (Request $request) {
    // Only allow in non-production
    if (app()->environment('production')) {
        return response()->json(['error' => 'Not available in production'], 403);
    }
    
    $request->session()->put('test_key', 'test_value_' . time());
    $request->session()->save();

    $webUser = Auth::guard('web')->user();
    $sanctumUser = Auth::guard('sanctum')->user();
    $defaultUser = Auth::user();

    return response()->json([
        'success' => true,
        'message' => 'Session test',
        'session_id' => session()->getId(),
        'session_driver' => config('session.driver'),
        'session_domain' => config('session.domain'),
        'has_session' => $request->hasSession(),
        'auth_status' => [
            'web_guard' => ['check' => Auth::guard('web')->check()],
            'sanctum_guard' => ['check' => Auth::guard('sanctum')->check()],
            'default_guard' => ['check' => Auth::check()],
        ],
    ]);
});

// ============================================================================
// AUTHENTICATION ROUTES (Strict Rate Limiting)
// ============================================================================
Route::middleware(['web', 'throttle:auth'])->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/login', [AuthController::class, 'login'])->name('api.login');
});

Route::middleware(['web', 'throttle:register'])->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
});

Route::middleware(['web', 'throttle:otp'])->group(function () {
    Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/auth/resend-verification', [AuthController::class, 'resendVerification']);
});

Route::middleware(['web', 'throttle:password-reset'])->group(function () {
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
});

// ============================================================================
// PUBLIC ROUTES (Rate Limited)
// ============================================================================

// Public: Subdomain availability (no auth required)
Route::middleware('throttle:api')->get('/stores/check-subdomain', [StoreController::class, 'checkSubdomain']);

// Public: Location API (no auth required)
Route::middleware('throttle:api')->group(function () {
    Route::get('/locations/cities', [LocationController::class, 'getCities']);
    Route::get('/locations/provinces', [LocationController::class, 'getProvinces']);
});

// Note: Image serving is handled by routes/web.php at /storage/{path}
// This allows images to be accessed at https://api.aidareu.com/storage/...
// without requiring /api/ prefix

// Public: Categories API (no auth required)
Route::middleware('throttle:api')->get('/public/categories', [CategoryController::class, 'getActiveCategories']);

// Public: Shipping API (no auth required)
Route::middleware('throttle:api')->post('/shipping/calculate', [ShippingController::class, 'calculate']);

// Public: Bank Accounts API (no auth required) - for checkout flow
Route::middleware('throttle:api')->get('/stores/{storeUuid}/bank-accounts', [BankAccountController::class, 'getByStore']);

// Public: Checkout API (no auth required)
Route::middleware('throttle:api')->group(function () {
    Route::post('/checkout', [CheckoutController::class, 'processCheckout']);
    Route::get('/order/{uuid}', [CheckoutController::class, 'getOrder']);
    Route::get('/stores/{storeUuid}/orders', [CheckoutController::class, 'getStoreOrders']);
    Route::put('/order/{uuid}/status', [CheckoutController::class, 'updateOrderStatus']);
});

// Public: Customer API (no auth required)
Route::middleware('throttle:api')->group(function () {
    Route::get('/stores/{storeUuid}/customers', [CustomerController::class, 'index']);
    Route::get('/customers', [CustomerManagementController::class, 'index']);
    Route::get('/customers/{uuid}', [CustomerController::class, 'show']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{uuid}', [CustomerController::class, 'update']);
    Route::delete('/customers/{uuid}', [CustomerController::class, 'destroy']);
});

// Master Data: User Management (should be protected - moved to authenticated routes)
Route::middleware(['throttle:api', 'web', 'auth:web,sanctum'])->group(function () {
    Route::get('/management/users', [UserManagementController::class, 'index']);
    Route::get('/management/users/{uuid}', [UserManagementController::class, 'show']);
    Route::post('/management/users', [UserManagementController::class, 'store']);
    Route::put('/management/users/{uuid}', [UserManagementController::class, 'update']);
    Route::delete('/management/users/{uuid}', [UserManagementController::class, 'destroy']);
});

// Public: Products API (rate limited)
Route::middleware('throttle:api')->group(function () {
    Route::get('/public/products', [ProductController::class, 'index']);
    Route::get('/public/products/{product}', [ProductController::class, 'show']);
});

// Protected: Product Write Operations (require auth)
Route::middleware(['throttle:api', 'web', 'auth:web,sanctum'])->group(function () {
    Route::post('/public/products', [ProductController::class, 'store']);
    Route::put('/public/products/{product}', [ProductController::class, 'update']);
    Route::post('/public/products/{product}', [ProductController::class, 'update']);
    Route::delete('/public/products/{product}', [ProductController::class, 'destroy']);
});

// Public: Products Digital API (rate limited)
Route::middleware('throttle:api')->group(function () {
    Route::get('/public/products-digital', [ProductDigitalController::class, 'index']);
    Route::get('/public/products-digital/categories', [ProductDigitalController::class, 'getCategories']);
    Route::get('/public/products-digital/{uuid}', [ProductDigitalController::class, 'show']);
});

// Protected: Digital Product Write Operations (require auth)
Route::middleware(['throttle:api', 'web', 'auth:web,sanctum'])->group(function () {
    Route::post('/public/products-digital', [ProductDigitalController::class, 'store']);
    Route::put('/public/products-digital/{uuid}', [ProductDigitalController::class, 'update']);
    Route::post('/public/products-digital/{uuid}', [ProductDigitalController::class, 'update']);
    Route::delete('/public/products-digital/{uuid}', [ProductDigitalController::class, 'destroy']);
});

// Protected: Editor Image Upload (require auth + rate limited)
Route::middleware(['throttle:upload', 'web', 'auth:web,sanctum'])->group(function () {
    Route::post('/upload-editor-image', [EditorImageController::class, 'upload']);
});
Route::options('/upload-editor-image', function() {
    return response()->json(['status' => 'OK'])
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
});

// Protected: User API (require auth)
Route::middleware(['throttle:api', 'web', 'auth:web,sanctum'])->group(function () {
    Route::put('/users/{uuid}', [UserController::class, 'update']);
});

// Public: Dashboard API (rate limited)
Route::middleware('throttle:api')->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/revenue', [DashboardController::class, 'revenue']);
    Route::get('/dashboard/popular-products', [DashboardController::class, 'popularProducts']);
    Route::get('/dashboard/recent-orders', [DashboardController::class, 'recentOrders']);
    Route::get('/dashboard/customers', [DashboardController::class, 'customers']);
    Route::get('/dashboard/stats/all', [DashboardController::class, 'statsAll']);
    Route::get('/dashboard/revenue/all', [DashboardController::class, 'revenueAll']);
    Route::get('/dashboard/popular-products/all', [DashboardController::class, 'popularProductsAll']);
    Route::get('/dashboard/popular-stores/all', [DashboardController::class, 'popularStoresAll']);
});

// Public: Notification API (rate limited)
Route::middleware('throttle:api')->prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread', [NotificationController::class, 'unread']);
    Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
});

// Public: Store API (rate limited)
Route::middleware('throttle:api')->group(function () {
    Route::get('/public/stores', [\App\Http\Controllers\StoreController::class, 'index']);
    Route::get('/public/stores/{uuid}', [\App\Http\Controllers\StoreController::class, 'show']);
    Route::get('/public/stores/by-domain/{domain}', [\App\Http\Controllers\StoreController::class, 'getByDomain']);
    Route::get('/stores', [\App\Http\Controllers\StoreController::class, 'index']);
    Route::get('/pixel-stores', [\App\Http\Controllers\Api\PixelStoreController::class, 'index']);
    Route::get('/landing-pages/{id}', [LandingPageController::class, 'showById']);
    Route::get('/public/social-media', [\App\Http\Controllers\Api\SocialMediaController::class, 'userIndex']);
    Route::get('/public/bank-accounts', [\App\Http\Controllers\Api\BankAccountController::class, 'userIndex']);
});

// Protected: Social Media & Bank Account Write Operations
Route::middleware(['throttle:api', 'web', 'auth:web,sanctum'])->group(function () {
    Route::post('/public/social-media', [\App\Http\Controllers\Api\SocialMediaController::class, 'userStore']);
    Route::put('/public/social-media/{socialMedia}', [\App\Http\Controllers\Api\SocialMediaController::class, 'userUpdate']);
    Route::post('/public/bank-accounts', [\App\Http\Controllers\Api\BankAccountController::class, 'userStore']);
    Route::put('/public/bank-accounts/{bankAccount}', [\App\Http\Controllers\Api\BankAccountController::class, 'userUpdate']);
    Route::delete('/public/bank-accounts/{bankAccount}', [\App\Http\Controllers\Api\BankAccountController::class, 'userDestroy']);
});

// Public: Pixel Store API (rate limited)
Route::middleware('throttle:api')->group(function () {
    Route::get('/public/pixel-stores', [\App\Http\Controllers\Api\PixelStoreController::class, 'index']);
});

// Protected: Pixel Store Write Operations
Route::middleware(['throttle:api', 'web', 'auth:web,sanctum'])->group(function () {
    Route::post('/public/pixel-stores', [\App\Http\Controllers\Api\PixelStoreController::class, 'store']);
    Route::put('/public/pixel-stores/{pixelUuid}', [\App\Http\Controllers\Api\PixelStoreController::class, 'update']);
    Route::delete('/public/pixel-stores/{pixelUuid}', [\App\Http\Controllers\Api\PixelStoreController::class, 'destroy']);
    Route::put('/public/stores/{uuid}', [\App\Http\Controllers\StoreController::class, 'update']);
});

// Auth (session-based) - Legacy
Route::middleware(['web', 'throttle:auth'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
});

// ============================================================================
// AUTHENTICATED ROUTES (Rate Limited)
// ============================================================================

// Authenticated routes (web guard first for session-based auth)
Route::middleware(['web', 'auth:web,sanctum', 'throttle:api'])->group(function () {
    // User info
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    
    // Legacy user route
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // User management routes
    Route::prefix('users')->group(function () {
        Route::get('/me', [UserController::class, 'me']); // MOVED FROM PUBLIC ROUTES
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
    

});

// Public
Route::middleware('throttle:api')->get('/landing/slug/{slug}', [LandingPageController::class, 'showBySlug']);

// Public: Theme Settings API (no auth required for public store view)
Route::middleware('throttle:api')->get('/theme-settings', [SettingTokoController::class, 'index']);

// Public: Get store by subdomain with all data
Route::middleware('throttle:api')->get('/store/{subdomain}', [SettingTokoController::class, 'getStoreBySubdomain']);

// Public: AI Download Routes (backup - primary access via /storage/ URL with nginx CORS)
Route::middleware('throttle:api')->group(function () {
    Route::get('/ai/logo/download/{filename}', [AIController::class, 'downloadLogo']);
    Route::get('/ai/product-photo/download/{filename}', [AIProductPhotoController::class, 'downloadProductPhoto']);
    Route::get('/ai/merged-photo/download/{filename}', [AIMergePhotoController::class, 'downloadMergedPhoto']);
    Route::get('/ai/fashion-photo/download/{filename}', [AIFashionPhotoController::class, 'downloadFashionPhoto']);
});

// ============================================================================
// PROTECTED ROUTES WITH SPECIFIC RATE LIMITING
// ============================================================================

// Protected: Theme Settings Management
Route::middleware(['web', 'auth:web,sanctum', 'throttle:api'])->group(function () {
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

// ============================================================================
// AI BRANDING ROUTES (Protected + AI Rate Limiting)
// ============================================================================
Route::middleware(['web', 'auth:web,sanctum', 'throttle:ai-generation'])->prefix('ai')->group(function () {
    Route::get('/test', [AIController::class, 'testEndpoint']);
    Route::post('/generate-logo', [AIController::class, 'generateLogo']);
    Route::post('/refine-logo', [AIController::class, 'refineLogo']);

    // AI Product Photo Routes
    Route::get('/product-photo/test', [AIProductPhotoController::class, 'testEndpoint']);
    Route::post('/generate-product-photo', [AIProductPhotoController::class, 'generateProductPhoto']);

    // AI Merge Photo Routes
    Route::get('/merge-photo/test', [AIMergePhotoController::class, 'testEndpoint']);
    Route::post('/generate-merged-photo', [AIMergePhotoController::class, 'generateMergedPhoto']);
    Route::post('/generate-instruction', [AIMergePhotoController::class, 'generateInstruction']);

    // AI Fashion Photo Routes
    Route::get('/fashion-photo/test', [AIFashionPhotoController::class, 'testEndpoint']);
    Route::post('/generate-fashion-photo', [AIFashionPhotoController::class, 'generateFashionPhoto']);

    // AI Landing Page Generation (with coin system)
    Route::post('/generate-landing-page', [LandingPageController::class, 'generateWithCoin']);
});

// ============================================================================
// COIN TRANSACTION ROUTES (Protected)
// ============================================================================
Route::middleware(['web', 'auth:web,sanctum', 'throttle:api'])->prefix('coins')->group(function () {
    Route::get('/', [CoinTransactionController::class, 'index']);
    Route::get('/summary', [CoinTransactionController::class, 'summary']);
    Route::post('/', [CoinTransactionController::class, 'store']);
    Route::get('/export', [CoinTransactionController::class, 'export']);
});

// ============================================================================
// PAYMENT ROUTES (Protected + Payment Rate Limiting)
// ============================================================================
Route::middleware(['web', 'auth:web,sanctum', 'throttle:payment'])->prefix('payment/duitku')->group(function () {
    Route::post('/create', [\App\Http\Controllers\Api\DuitkuController::class, 'createPayment']);
    Route::get('/status/{merchantOrderId}', [\App\Http\Controllers\Api\DuitkuController::class, 'checkStatus']);
    Route::get('/methods', [\App\Http\Controllers\Api\DuitkuController::class, 'getPaymentMethods']);
});

// ============================================================================
// AI GENERATION HISTORY ROUTES (Protected)
// ============================================================================
Route::middleware(['web', 'auth:web,sanctum', 'throttle:api'])->prefix('ai-history')->group(function () {
    Route::get('/', [\App\Http\Controllers\AiGenerationHistoryController::class, 'index']);
    Route::get('/check-coin', [\App\Http\Controllers\AiGenerationHistoryController::class, 'checkCoin']);
    Route::post('/', [\App\Http\Controllers\AiGenerationHistoryController::class, 'store']);
    Route::delete('/{id}', [\App\Http\Controllers\AiGenerationHistoryController::class, 'destroy']);
});

// ============================================================================
// LANDING PAGE ROUTES (Protected)
// ============================================================================
Route::middleware(['web', 'auth:web,sanctum', 'throttle:api'])->prefix('landing')->group(function () {
    Route::post('/generate', [LandingPageController::class, 'generate']);
    Route::post('/', [LandingPageController::class, 'store']);
    Route::get('/', [LandingPageController::class, 'index']);
    Route::get('/test-openai', [LandingPageController::class, 'testOpenAI']);

    Route::post('/{landing}/update', [LandingPageController::class, 'update']);
    Route::get('/{landing}', [LandingPageController::class, 'showById']);
    Route::delete('/{landing}', [LandingPageController::class, 'destroy']);
    Route::post('/{landing}/duplicate', [LandingPageController::class, 'duplicate']);

    Route::get('/uuid/{uuid}', [LandingPageController::class, 'showByUuid']);
    Route::post('/uuid/{uuid}/update', [LandingPageController::class, 'updateByUuid']);
    Route::delete('/uuid/{uuid}', [LandingPageController::class, 'destroyByUuid']);
    Route::post('/uuid/{uuid}/duplicate', [LandingPageController::class, 'duplicateByUuid']);
    Route::get('/uuid/{uuid}/images', [LandingPageController::class, 'getConsistentImages']);
});