<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use App\Models\DetailOrder;
use App\Models\Store;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    /**
     * Process checkout and create order
     */
    public function processCheckout(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer.nama' => 'required|string|max:255',
            'customer.noHp' => 'required|string|max:20',
            'customer.email' => 'nullable|email|max:255',
            'customer.provinsi' => 'required|string|max:100',
            'customer.kota' => 'required|string|max:100',
            'customer.kecamatan' => 'required|string|max:100',
            'customer.alamat' => 'required|string',
            'order.uuidStore' => 'required|string',
            'order.totalHarga' => 'required|numeric|min:0',
            'order.ekspedisi' => 'required|string|max:255',
            'order.estimasiTiba' => 'nullable|string|max:255',
            'order.uuidBankAccount' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.uuidProduct' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $customerData = $request->input('customer');
            $orderData = $request->input('order');
            $items = $request->input('items');

            // Check if customer exists by email or phone
            $customer = Customer::where('uuid_store', $orderData['uuidStore'])
                ->where(function ($query) use ($customerData) {
                    $query->where('email', $customerData['email'])
                        ->orWhere('no_hp', $customerData['noHp']);
                })
                ->first();

            if ($customer) {
                // Update existing customer
                $customer->update([
                    'nama' => $customerData['nama'],
                    'no_hp' => $customerData['noHp'],
                    'email' => $customerData['email'] ?? null,
                    'provinsi' => $customerData['provinsi'],
                    'kota' => $customerData['kota'],
                    'kecamatan' => $customerData['kecamatan'],
                    'alamat' => $customerData['alamat']
                ]);
            } else {
                // Create new customer
                $customer = Customer::create([
                    'nama' => $customerData['nama'],
                    'no_hp' => $customerData['noHp'],
                    'email' => $customerData['email'] ?? null,
                    'provinsi' => $customerData['provinsi'],
                    'kota' => $customerData['kota'],
                    'kecamatan' => $customerData['kecamatan'],
                    'alamat' => $customerData['alamat'],
                    'uuid_store' => $orderData['uuidStore']
                ]);
            }

            // Create order (nomor_order will be auto-generated)
            $order = Order::create([
                'uuid_store' => $orderData['uuidStore'],
                'uuid_customer' => $customer->uuid,
                'voucher' => $orderData['voucher'] ?? null,
                'total_harga' => $orderData['totalHarga'],
                'ekspedisi' => $orderData['ekspedisi'],
                'estimasi_tiba' => $orderData['estimasiTiba'] ?? null,
                'status' => 'pending',
                'uuid_bank_account' => $orderData['uuidBankAccount']
            ]);

            // Create detail orders
            $detailOrders = [];
            foreach ($items as $item) {
                $detailOrder = DetailOrder::create([
                    'uuid_order' => $order->uuid,
                    'uuid_product' => $item['uuidProduct'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price']
                ]);
                $detailOrders[] = $detailOrder;
            }

            DB::commit();

            // Load relationships
            $order->load(['customer', 'store', 'bankAccount', 'detailOrders.product']);

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil dibuat',
                'data' => [
                    'order' => $order,
                    'customer' => $customer,
                    'details' => $detailOrders
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Checkout error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get order details by UUID
     */
    public function getOrder(Request $request, $uuid)
    {
        try {
            $order = Order::with([
                'customer',
                'store',
                'bankAccount',
                'detailOrders.product'
            ])->where('uuid', $uuid)->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $order
            ]);

        } catch (\Exception $e) {
            Log::error('Get order error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all orders for a store
     */
    public function getStoreOrders(Request $request, $storeUuid)
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

            $perPage = $request->get('per_page', 20);
            $search = $request->get('search');
            $status = $request->get('status');

            $query = Order::with([
                'customer',
                'bankAccount',
                'detailOrders.product'
            ]);

            // Filter by store UUID
            if ($storeUuid) {
                // Both superadmin and regular users: if storeUuid provided, filter by it
                $query->where('uuid_store', $storeUuid);
            } elseif (!$isSuperadmin) {
                // Non-superadmin without storeUuid: should not happen, return empty
                return response()->json([
                    'success' => false,
                    'message' => 'Store UUID is required for non-superadmin users',
                    'data' => [
                        'data' => [],
                        'total' => 0
                    ]
                ], 400);
            }
            // Superadmin without storeUuid: show all orders (no filter)

            // Search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nomor_order', 'like', "%{$search}%")
                      ->orWhereHas('customer', function($customerQuery) use ($search) {
                          $customerQuery->where('nama', 'like', "%{$search}%")
                                        ->orWhere('email', 'like', "%{$search}%")
                                        ->orWhere('no_hp', 'like', "%{$search}%");
                      });
                });
            }

            // Status filter
            if ($status) {
                $query->where('status', $status);
            }

            $orders = $query->orderBy('created_at', 'desc')
                           ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $orders
            ]);

        } catch (\Exception $e) {
            Log::error('Get store orders error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update order status
     */
    public function updateOrderStatus(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:pending,processing,shipped,completed,cancelled'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $order = Order::where('uuid', $uuid)->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order tidak ditemukan'
                ], 404);
            }

            $order->update([
                'status' => $request->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status order berhasil diupdate',
                'data' => $order
            ]);

        } catch (\Exception $e) {
            Log::error('Update order status error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate status order',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}