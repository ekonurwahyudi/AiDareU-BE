<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoinTransaction;
use App\Models\DuitkuTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DuitkuController extends Controller
{
    private $merchantCode;
    private $apiKey;
    private $sandboxMode;

    public function __construct()
    {
        // Ambil dari environment variable
        // Default: D19704 (sandbox merchant code)
        $this->merchantCode = env('DUITKU_MERCHANT_CODE', 'D19704');
        $this->apiKey = env('DUITKU_API_KEY', '5bcc9617d7ed80563ff594335ec4b');
        // Default: true (sandbox mode)
        $this->sandboxMode = filter_var(env('DUITKU_SANDBOX', true), FILTER_VALIDATE_BOOLEAN);
        
        Log::info('DuitkuController initialized', [
            'merchant_code' => $this->merchantCode,
            'api_key_set' => !empty($this->apiKey),
            'sandbox_mode' => $this->sandboxMode,
            'endpoint' => $this->sandboxMode 
                ? 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry'
                : 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry',
        ]);
    }

    /**
     * Create Duitku payment transaction
     * POST /api/payment/duitku/create
     * Dokumentasi: https://docs.duitku.com/api/id/#permintaan-transaksi
     */
    public function createPayment(Request $request)
    {
        try {
            $request->validate([
                'coin_amount' => 'required|integer|min:1',
                'payment_method' => 'nullable|string|max:2', // Optional, default QRIS
            ]);

            /** @var \App\Models\User|null $user */
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $coinAmount = $request->coin_amount;
            // Harga: 1 coin = Rp 1.000
            $paymentAmount = $coinAmount * 1000;

            // Payment method: default SP (Shopee Pay QRIS)
            $paymentMethod = $request->payment_method ?? 'SP';

            // Generate unique order ID
            $merchantOrderId = 'AIDUTP' . time() . rand(100, 999);

            // Generate signature: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
            // Sesuai dokumentasi Duitku
            $signature = md5($this->merchantCode . $merchantOrderId . $paymentAmount . $this->apiKey);

            Log::info('Duitku signature generation', [
                'merchant_code' => $this->merchantCode,
                'merchant_order_id' => $merchantOrderId,
                'payment_amount' => $paymentAmount,
                'signature' => $signature
            ]);

            // Prepare request data sesuai dokumentasi
            $requestData = [
                'merchantCode' => $this->merchantCode,
                'paymentAmount' => $paymentAmount,
                'paymentMethod' => $paymentMethod,
                'merchantOrderId' => $merchantOrderId,
                'productDetails' => "Top Up {$coinAmount} Coin AiDareU",
                'email' => $user->email,
                'phoneNumber' => $user->phone ?? '',
                'additionalParam' => '',
                'merchantUserInfo' => $user->email,
                'customerVaName' => substr($user->name ?? 'User', 0, 20), // Max 20 chars
                'callbackUrl' => url('/api/payment/duitku/callback'),
                'returnUrl' => env('APP_FRONTEND_URL', 'https://aidareu.com') . '/apps/tokoku/coin-history',
                'signature' => $signature,
                'expiryPeriod' => 60, // 60 menit
            ];

            // Item details (opsional tapi bagus untuk tracking)
            $requestData['itemDetails'] = [
                [
                    'name' => "Top Up {$coinAmount} Coin",
                    'price' => $paymentAmount,
                    'quantity' => 1
                ]
            ];

            // Customer detail
            $requestData['customerDetail'] = [
                'firstName' => $user->name ?? 'User',
                'lastName' => '',
                'email' => $user->email,
                'phoneNumber' => $user->phone ?? '',
            ];

            Log::info('Duitku payment request', [
                'user_id' => $user->id,
                'coin_amount' => $coinAmount,
                'payment_amount' => $paymentAmount,
                'payment_method' => $paymentMethod,
                'order_id' => $merchantOrderId,
                'sandbox_mode' => $this->sandboxMode,
            ]);

            // Endpoint sesuai dokumentasi
            // Development: https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry
            // Production: https://passport.duitku.com/webapi/api/merchant/v2/inquiry
            $endpoint = $this->sandboxMode
                ? 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry'
                : 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry';

            Log::info('Duitku API call', [
                'endpoint' => $endpoint,
                'request_data' => array_merge($requestData, ['signature' => '***HIDDEN***'])
            ]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post($endpoint, $requestData);

            Log::info('Duitku API response', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            if (!$response->successful()) {
                Log::error('Duitku API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                $errorBody = $response->json();
                $errorMessage = $errorBody['Message'] ?? $errorBody['statusMessage'] ?? 'Payment gateway error';

                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'debug' => [
                        'status' => $response->status(),
                        'response' => $response->body()
                    ]
                ], 500);
            }

            $result = $response->json();

            // Check response - statusCode "00" = SUCCESS
            if (!isset($result['statusCode']) || $result['statusCode'] !== '00') {
                Log::error('Duitku transaction failed', [
                    'response' => $result
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $result['statusMessage'] ?? 'Transaction failed',
                    'debug' => $result
                ], 400);
            }

            // Save transaction to database
            $transaction = DuitkuTransaction::create([
                'user_id' => $user->id,
                'merchant_order_id' => $merchantOrderId,
                'reference' => $result['reference'] ?? null,
                'payment_method' => $paymentMethod,
                'coin_amount' => $coinAmount,
                'payment_amount' => $paymentAmount,
                'status' => 'pending',
                'payment_url' => $result['paymentUrl'] ?? null,
                'va_number' => $result['vaNumber'] ?? null,
                'qr_string' => $result['qrString'] ?? null,
            ]);

            Log::info('Duitku transaction created', [
                'transaction_id' => $transaction->id,
                'reference' => $result['reference'] ?? null,
            ]);

            // Return response untuk frontend
            return response()->json([
                'success' => true,
                'message' => 'Payment created successfully',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'merchant_order_id' => $merchantOrderId,
                    'reference' => $result['reference'] ?? null,
                    'payment_url' => $result['paymentUrl'] ?? null,
                    'va_number' => $result['vaNumber'] ?? null,
                    'qr_string' => $result['qrString'] ?? null,
                    'amount' => $paymentAmount,
                    'coin_amount' => $coinAmount,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Duitku createPayment error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Handle Duitku payment callback
     * POST /api/payment/duitku/callback
     * Dokumentasi: https://docs.duitku.com/api/id/#callback
     * 
     * Content-Type: x-www-form-urlencoded
     */
    public function handleCallback(Request $request)
    {
        try {
            Log::info('Duitku callback received', $request->all());

            // Get callback parameters (x-www-form-urlencoded)
            $merchantCode = $request->input('merchantCode');
            $amount = $request->input('amount');
            $merchantOrderId = $request->input('merchantOrderId');
            $productDetail = $request->input('productDetail');
            $additionalParam = $request->input('additionalParam');
            $paymentCode = $request->input('paymentCode');
            $resultCode = $request->input('resultCode');
            $merchantUserId = $request->input('merchantUserId');
            $reference = $request->input('reference');
            $signature = $request->input('signature');
            $publisherOrderId = $request->input('publisherOrderId');
            $spUserHash = $request->input('spUserHash');
            $settlementDate = $request->input('settlementDate');
            $issuerCode = $request->input('issuerCode');

            // Validate required parameters
            if (empty($merchantCode) || empty($amount) || empty($merchantOrderId) || empty($signature)) {
                Log::error('Duitku callback: Bad Parameter', [
                    'merchantCode' => $merchantCode,
                    'amount' => $amount,
                    'merchantOrderId' => $merchantOrderId,
                    'signature' => $signature
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Bad Parameter'
                ], 400);
            }

            // Validate signature: MD5(merchantCode + amount + merchantOrderId + apiKey)
            $calcSignature = md5($merchantCode . $amount . $merchantOrderId . $this->apiKey);

            if ($signature !== $calcSignature) {
                Log::error('Duitku callback: Bad Signature', [
                    'received' => $signature,
                    'calculated' => $calcSignature
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Bad Signature'
                ], 400);
            }

            // Find transaction
            $transaction = DuitkuTransaction::where('merchant_order_id', $merchantOrderId)->first();

            if (!$transaction) {
                Log::error('Duitku callback: Transaction not found', [
                    'merchant_order_id' => $merchantOrderId
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            // Update transaction status
            // resultCode: 00 = Success, 01 = Failed
            $oldStatus = $transaction->status;
            $newStatus = $resultCode === '00' ? 'success' : 'failed';

            $transaction->update([
                'status' => $newStatus,
                'result_code' => $resultCode,
                'payment_code' => $paymentCode,
                'callback_reference' => $reference,
                'settlement_date' => $settlementDate,
                'publisher_order_id' => $publisherOrderId,
                'issuer_code' => $issuerCode,
            ]);

            Log::info('Duitku transaction updated', [
                'transaction_id' => $transaction->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'result_code' => $resultCode
            ]);

            // If payment successful and not already processed, add coins to user
            if ($resultCode === '00' && $oldStatus !== 'success') {
                $user = User::find($transaction->user_id);

                if ($user) {
                    // Create coin transaction
                    CoinTransaction::create([
                        'uuid_user' => $user->uuid,
                        'keterangan' => "Top Up via Duitku - {$transaction->merchant_order_id}",
                        'coin_masuk' => $transaction->coin_amount,
                        'coin_keluar' => 0,
                        'status' => 'berhasil',
                    ]);

                    Log::info('Coins added to user', [
                        'user_id' => $user->id,
                        'coin_amount' => $transaction->coin_amount
                    ]);
                }
            }

            // Return success response to Duitku
            return response()->json([
                'success' => true,
                'message' => 'Callback processed successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Duitku callback error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Callback processing error'
            ], 500);
        }
    }


    /**
     * Check transaction status
     * GET /api/payment/duitku/status/{merchantOrderId}
     * Dokumentasi: https://docs.duitku.com/api/id/#cek-transaksi
     */
    public function checkStatus($merchantOrderId)
    {
        try {
            // First check local database
            $transaction = DuitkuTransaction::where('merchant_order_id', $merchantOrderId)->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            // Optionally check status from Duitku API
            $signature = md5($this->merchantCode . $merchantOrderId . $this->apiKey);

            $endpoint = $this->sandboxMode
                ? 'https://sandbox.duitku.com/webapi/api/merchant/transactionStatus'
                : 'https://passport.duitku.com/webapi/api/merchant/transactionStatus';

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post($endpoint, [
                'merchantCode' => $this->merchantCode,
                'merchantOrderId' => $merchantOrderId,
                'signature' => $signature
            ]);

            $apiStatus = null;
            if ($response->successful()) {
                $result = $response->json();
                $apiStatus = $result['statusCode'] ?? null;
                
                // Update local status if different
                // statusCode: 00 = Success, 01 = Pending, 02 = Canceled
                if ($apiStatus === '00' && $transaction->status !== 'success') {
                    $transaction->update(['status' => 'success']);
                    
                    // Add coins if not already added
                    $user = User::find($transaction->user_id);
                    if ($user) {
                        $existingCoin = CoinTransaction::where('keterangan', 'LIKE', "%{$merchantOrderId}%")->first();
                        if (!$existingCoin) {
                            CoinTransaction::create([
                                'uuid_user' => $user->uuid,
                                'keterangan' => "Top Up via Duitku - {$merchantOrderId}",
                                'coin_masuk' => $transaction->coin_amount,
                                'coin_keluar' => 0,
                                'status' => 'berhasil',
                            ]);
                        }
                    }
                } elseif ($apiStatus === '02' && $transaction->status !== 'canceled') {
                    $transaction->update(['status' => 'canceled']);
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'merchant_order_id' => $transaction->merchant_order_id,
                    'reference' => $transaction->reference,
                    'status' => $transaction->status,
                    'api_status_code' => $apiStatus,
                    'coin_amount' => $transaction->coin_amount,
                    'payment_amount' => $transaction->payment_amount,
                    'payment_url' => $transaction->payment_url,
                    'created_at' => $transaction->created_at->toDateTimeString(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Check status error', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error checking status'
            ], 500);
        }
    }

    /**
     * Get available payment methods
     * GET /api/payment/duitku/methods
     * Dokumentasi: https://docs.duitku.com/api/id/#get-payment-method
     */
    public function getPaymentMethods(Request $request)
    {
        try {
            $amount = $request->input('amount', 10000);
            $datetime = now()->format('Y-m-d H:i:s');
            
            // Signature: SHA256(merchantCode + amount + datetime + apiKey)
            $signature = hash('sha256', $this->merchantCode . $amount . $datetime . $this->apiKey);

            $endpoint = $this->sandboxMode
                ? 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod'
                : 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod';

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post($endpoint, [
                'merchantcode' => $this->merchantCode,
                'amount' => $amount,
                'datetime' => $datetime,
                'signature' => $signature
            ]);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get payment methods'
                ], 500);
            }

            $result = $response->json();

            return response()->json([
                'success' => true,
                'data' => $result['paymentFee'] ?? []
            ]);

        } catch (\Exception $e) {
            Log::error('Get payment methods error', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error getting payment methods'
            ], 500);
        }
    }
}
