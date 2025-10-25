<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $storeUuid = $request->query('store_uuid');

            // Get user
            $user = null;

            // Try Sanctum auth first
            if ($request->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && $request->header('X-User-UUID')) {
                $uuid = $request->header('X-User-UUID');
                $user = User::where('uuid', $uuid)->first();
            }

            // Log for debugging
            \Log::info('DashboardController@stats', [
                'user_uuid' => $user ? $user->uuid : null,
                'user_roles' => $user ? $user->getRoleNames()->toArray() : [],
                'store_uuid_param' => $storeUuid,
                'has_bearer_token' => $request->bearerToken() ? 'yes' : 'no'
            ]);

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated. Please login again.',
                    'data' => null
                ], 401);
            }

            // Check if user is superadmin
            $isSuperadmin = $user->hasRole('superadmin');

            // Get store
            if ($storeUuid) {
                $store = Store::where('uuid', $storeUuid)->first();
            } else {
                $store = $user->stores()->first();
            }

            \Log::info('DashboardController@stats - Store found', [
                'store_uuid' => $store ? $store->uuid : null,
                'store_name' => $store ? $store->nama_toko : null
            ]);

            // If superadmin and no store specified, return aggregated data from all stores
            if ($isSuperadmin && !$store) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'No store found for user',
                    'data' => [
                        'total_orders' => 0,
                        'total_revenue' => 0,
                        'total_products' => 0,
                        'total_customers' => 0,
                        'orders_growth' => 0,
                        'revenue_growth' => 0,
                        'products_growth' => 0,
                        'customers_growth' => 0,
                    ]
                ]);
            }

            // Get current month stats
            $currentMonth = now()->startOfMonth();
            $previousMonth = now()->subMonth()->startOfMonth();

            // Total orders
            $totalOrders = DB::table('orders')
                ->where('uuid_store', $store->uuid)
                ->where('created_at', '>=', $currentMonth)
                ->count();

            $previousOrders = DB::table('orders')
                ->where('uuid_store', $store->uuid)
                ->whereBetween('created_at', [$previousMonth, $currentMonth])
                ->count();

            $ordersGrowth = $previousOrders > 0
                ? (($totalOrders - $previousOrders) / $previousOrders) * 100
                : 0;

            // Total revenue
            $totalRevenue = DB::table('orders')
                ->where('uuid_store', $store->uuid)
                ->where('created_at', '>=', $currentMonth)
                ->where('status', 'completed')
                ->sum('total_harga');

            $previousRevenue = DB::table('orders')
                ->where('uuid_store', $store->uuid)
                ->whereBetween('created_at', [$previousMonth, $currentMonth])
                ->where('status', 'completed')
                ->sum('total_harga');

            $revenueGrowth = $previousRevenue > 0
                ? (($totalRevenue - $previousRevenue) / $previousRevenue) * 100
                : 0;

            // Total products
            $totalProducts = DB::table('products')
                ->where('uuid_store', $store->uuid)
                ->where('status_produk', 'active')
                ->count();

            $previousProducts = DB::table('products')
                ->where('uuid_store', $store->uuid)
                ->where('created_at', '<', $currentMonth)
                ->where('status_produk', 'active')
                ->count();

            $productsGrowth = $previousProducts > 0
                ? (($totalProducts - $previousProducts) / $previousProducts) * 100
                : 0;

            // Total customers
            $totalCustomers = DB::table('customers')
                ->where('uuid_store', $store->uuid)
                ->where('created_at', '>=', $currentMonth)
                ->count();

            $previousCustomers = DB::table('customers')
                ->where('uuid_store', $store->uuid)
                ->whereBetween('created_at', [$previousMonth, $currentMonth])
                ->count();

            $customersGrowth = $previousCustomers > 0
                ? (($totalCustomers - $previousCustomers) / $previousCustomers) * 100
                : 0;

            return response()->json([
                'status' => 'success',
                'message' => 'Dashboard statistics retrieved successfully',
                'data' => [
                    'total_orders' => $totalOrders,
                    'total_revenue' => (float) $totalRevenue,
                    'total_products' => $totalProducts,
                    'total_customers' => $totalCustomers,
                    'orders_growth' => round($ordersGrowth, 1),
                    'revenue_growth' => round($revenueGrowth, 1),
                    'products_growth' => round($productsGrowth, 1),
                    'customers_growth' => round($customersGrowth, 1),
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in DashboardController@stats: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error retrieving dashboard statistics: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Get revenue data for charts
     */
    public function revenue(Request $request): JsonResponse
    {
        try {
            $storeUuid = $request->query('store_uuid');
            $period = $request->query('period', 'month'); // week, month, year

            // Get user
            $user = null;

            // Try Sanctum auth first
            if ($request->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && $request->header('X-User-UUID')) {
                $uuid = $request->header('X-User-UUID');
                $user = User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated. Please login again.',
                    'data' => null
                ], 401);
            }

            // Check if user is superadmin
            $isSuperadmin = $user->hasRole('superadmin');

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found',
                    'data' => null
                ], 404);
            }

            // Get store
            if ($storeUuid) {
                $store = Store::where('uuid', $storeUuid)->first();
            } else {
                $store = $user->stores()->first();
            }

            if (!$store) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'No store found',
                    'data' => []
                ]);
            }

            // Determine date range based on period
            switch ($period) {
                case 'week':
                    $startDate = now()->subWeeks(4);
                    $groupBy = 'DATE(created_at)';
                    break;
                case 'year':
                    $startDate = now()->subYear();
                    $groupBy = "TO_CHAR(created_at, 'YYYY-MM')";
                    break;
                case 'month':
                default:
                    $startDate = now()->subMonths(6);
                    $groupBy = "TO_CHAR(created_at, 'YYYY-MM')";
                    break;
            }

            // Get revenue data
            $revenueData = DB::table('orders')
                ->select(
                    DB::raw("$groupBy as date"),
                    DB::raw("SUM(CASE WHEN status = 'completed' THEN total_harga ELSE 0 END) as revenue"),
                    DB::raw('COUNT(*) as orders')
                )
                ->where('uuid_store', $store->uuid)
                ->where('created_at', '>=', $startDate)
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'status' => 'success',
                'message' => 'Revenue data retrieved successfully',
                'data' => $revenueData->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'revenue' => (float) $item->revenue,
                        'orders' => $item->orders
                    ];
                })
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in DashboardController@revenue: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error retrieving revenue data: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Get popular products
     */
    public function popularProducts(Request $request): JsonResponse
    {
        try {
            $storeUuid = $request->query('store_uuid');
            $limit = $request->query('limit', 5);

            // Get user
            $user = null;

            // Try Sanctum auth first
            if ($request->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && $request->header('X-User-UUID')) {
                $uuid = $request->header('X-User-UUID');
                $user = User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated. Please login again.',
                    'data' => null
                ], 401);
            }

            // Check if user is superadmin
            $isSuperadmin = $user->hasRole('superadmin');

            // Get store
            if ($storeUuid) {
                $store = Store::where('uuid', $storeUuid)->first();
            } else {
                $store = $user->stores()->first();
            }

            if (!$store) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'No store found',
                    'data' => []
                ]);
            }

            // Get popular products from order items
            $popularProducts = DB::table('detail_orders')
                ->join('orders', 'detail_orders.uuid_order', '=', 'orders.uuid')
                ->join('products', 'detail_orders.uuid_product', '=', 'products.uuid')
                ->select(
                    'products.uuid',
                    'products.nama_produk as name',
                    DB::raw('SUM(detail_orders.quantity) as total_sold'),
                    DB::raw('SUM(detail_orders.quantity * detail_orders.price) as revenue')
                )
                ->where('orders.uuid_store', $store->uuid)
                ->where('orders.status', 'completed')
                ->groupBy('products.uuid', 'products.nama_produk')
                ->orderBy('total_sold', 'desc')
                ->limit($limit)
                ->get();

            // Add image data to results
            $popularProducts = $popularProducts->map(function ($item) {
                $product = DB::table('products')->where('uuid', $item->uuid)->first();
                $item->image = $product ? $product->upload_gambar_produk : null;
                return $item;
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Popular products retrieved successfully',
                'data' => $popularProducts->map(function ($item) {
                    return [
                        'uuid' => $item->uuid,
                        'name' => $item->name,
                        'image' => $item->image,
                        'total_sold' => $item->total_sold,
                        'revenue' => (float) $item->revenue
                    ];
                })
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in DashboardController@popularProducts: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error retrieving popular products: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Get recent orders
     */
    public function recentOrders(Request $request): JsonResponse
    {
        try {
            $storeUuid = $request->query('store_uuid');
            $limit = $request->query('limit', 10);

            // Get user
            $user = null;

            // Try Sanctum auth first
            if ($request->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && $request->header('X-User-UUID')) {
                $uuid = $request->header('X-User-UUID');
                $user = User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated. Please login again.',
                    'data' => null
                ], 401);
            }

            // Check if user is superadmin
            $isSuperadmin = $user->hasRole('superadmin');

            // Get store
            if ($storeUuid) {
                $store = Store::where('uuid', $storeUuid)->first();
            } else {
                $store = $user->stores()->first();
            }

            if (!$store) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'No store found',
                    'data' => []
                ]);
            }

            // Get recent orders with customer names
            $recentOrders = DB::table('orders')
                ->join('customers', 'orders.uuid_customer', '=', 'customers.uuid')
                ->select(
                    'orders.uuid',
                    'orders.nomor_order as order_number',
                    'customers.nama as customer_name',
                    'orders.total_harga as total',
                    'orders.status',
                    'orders.created_at'
                )
                ->where('orders.uuid_store', $store->uuid)
                ->orderBy('orders.created_at', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'status' => 'success',
                'message' => 'Recent orders retrieved successfully',
                'data' => $recentOrders->map(function ($item) {
                    return [
                        'uuid' => $item->uuid,
                        'order_number' => $item->order_number,
                        'customer_name' => $item->customer_name,
                        'total' => (float) $item->total,
                        'status' => $item->status,
                        'created_at' => $item->created_at
                    ];
                })
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in DashboardController@recentOrders: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error retrieving recent orders: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Get customers data
     */
    public function customers(Request $request): JsonResponse
    {
        try {
            $storeUuid = $request->query('store_uuid');
            $limit = $request->query('limit', 10);

            // Get user
            $user = null;

            // Try Sanctum auth first
            if ($request->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && $request->header('X-User-UUID')) {
                $uuid = $request->header('X-User-UUID');
                $user = User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated. Please login again.',
                    'data' => null
                ], 401);
            }

            // Check if user is superadmin
            $isSuperadmin = $user->hasRole('superadmin');

            // Get store
            if ($storeUuid) {
                $store = Store::where('uuid', $storeUuid)->first();
            } else {
                $store = $user->stores()->first();
            }

            if (!$store) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'No store found',
                    'data' => []
                ]);
            }

            // Get customers with their order stats
            $customers = DB::table('customers')
                ->leftJoin('orders', 'customers.uuid', '=', 'orders.uuid_customer')
                ->select(
                    'customers.uuid',
                    'customers.nama as name',
                    'customers.email',
                    DB::raw('COUNT(orders.uuid) as total_orders'),
                    DB::raw('SUM(CASE WHEN orders.status = \'completed\' THEN orders.total_harga ELSE 0 END) as total_spent')
                )
                ->where('customers.uuid_store', $store->uuid)
                ->groupBy('customers.uuid', 'customers.nama', 'customers.email')
                ->orderBy('total_spent', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'status' => 'success',
                'message' => 'Customers retrieved successfully',
                'data' => $customers->map(function ($item) {
                    return [
                        'uuid' => $item->uuid,
                        'name' => $item->name,
                        'email' => $item->email,
                        'total_orders' => $item->total_orders,
                        'total_spent' => (float) $item->total_spent
                    ];
                })
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in DashboardController@customers: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error retrieving customers: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
}
