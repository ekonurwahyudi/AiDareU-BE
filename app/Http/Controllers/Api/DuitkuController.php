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
use Illuminate\Support\Str;

class DuitkuController extends Controller
{
    private $merchantCode;
    private $apiKey;
    private $sandboxMode;

    public function __construct()
    {
        // Ambil dari environment variable
        $this->merchantCode = env('DUITKU_MERCHANT_CODE', 'D21180');
        $this->apiKey = env('DUITKU_API_KEY');
        // PENTING: Set false untuk production karena merchant code D21180 adalah production
        $this->sandboxMode = filter_var(env('DUITKU_SANDBOX', false), FILTER_VALIDATE_BOOLEAN);
        
        Log::info('DuitkuController initialized', [
            'merchant_code' => $this->merchantCode,
            'api_key_set' => !empty($this->apiKey),
            'sandbox_mode' => $this->sandboxMode,
            'sandbox_env_raw' => env('DUITKU_SANDBOX'),
        ]);
    }

    /**
     * Create Duitku QRIS payment transaction (Direct)
     * POST /api/payment/duitku/create
     * Sesuai dokumentasi: https://docs.duitku.com/api/id/#metode-pembayaran
     */
    public function createPayment(Request $request)
    {
        try {
            $request->validate([
                'coin_amount' => 'required|integer|min:1',
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
            // Harga: 5 pts = Rp 5.000, 10 pts = Rp 10.000 (1 coin = Rp 1.000)
            $paymentAmount = $coinAmount * 1000;

            // Generate unique order ID
            $merchantOrderId = 'TOPUP-' . strtoupper(Str::random(10)) . '-' . time();

            // Generate signature untuk v2/inquiry: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
            $signatureString = $this->merchantCode . $merchantOrderId . $paymentAmount . $this->apiKey;
            $signature = md5($signatureString);

            Log::info('Duitku QRIS signature generation', [
                'merchant_code' => $this->merchantCode,
                'merchant_order_id' => $merchantOrderId,
                'payment_amount' => $paymentAmount,
                'signature_string' => $this->merchantCode . $merchantOrderId . $paymentAmount . '***API_KEY***',
                'signature' => $signature
            ]);

            // Prepare request data untuk v2/inquiry (QRIS Direct) sesuai dokumentasi
            // Referensi: https://docs.duitku.com/api/id/#metode-pembayaran
            $requestData = [
                'merchantCode' => $this->merchantCode,
                'paymentAmount' => $paymentAmount,
                'paymentMethod' => 'SP', // SP = Shopee Pay QRIS
                'merchantOrderId' => $merchantOrderId,
                'productDetails' => "Top Up {$coinAmount} Coin AiDareU",
                'email' => $user->email,
                'customerVaName' => $user->name ?? 'User',
                'callbackUrl' => url('/api/payment/duitku/callback'),
                'returnUrl' => env('APP_FRONTEND_URL', 'https://aidareu.com') . '/apps/tokoku/coin-history',
                'signature' => $signature,
                'expiryPeriod' => 60, // 60 minutes expiry
            ];

            Log::info('Duitku QRIS payment request', [
                'user_id' => $user->id,
                'coin_amount' => $coinAmount,
                'payment_amount' => $paymentAmount,
                'order_id' => $merchantOrderId,
                'sandbox_mode' => $this->sandboxMode,
                'request_data' => $requestData
            ]);

            // Call Duitku v2/inquiry API untuk QRIS Direct
            $endpoint = $this->sandboxMode
                ? 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry'
                : 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry';

            Log::info('Duitku QRIS API call', [
                'endpoint' => $endpoint
            ]);

            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->post($endpoint, $requestData);

            Log::info('Duitku QRIS API response', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            if (!$response->successful()) {
                Log::error('Duitku QRIS API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                $errorBody = $response->json();
                $errorMessage = $errorBody['Message'] ?? $errorBody['message'] ?? 'Payment gateway error';

                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'debug' => [
                        'status' => $response->status(),
                        'response' => $errorBody
                    ]
                ], 500);
            }

            $result = $response->json();

            // Check if response is successful - v2/inquiry mengembalikan statusCode dan qrString
            if (!isset($result['statusCode']) || $result['statusCode'] !== '00') {
                Log::error('Duitku QRIS transaction failed', [
                    'response' => $result
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $result['statusMessage'] ?? 'Transaction failed'
                ], 400);
            }

            // Save transaction to database
            $transaction = DuitkuTransaction::create([
                'user_id' => $user->id,
                'merchant_order_id' => $merchantOrderId,
                'reference' => $result['reference'] ?? null,
                'payment_method' => 'SP', // Shopee Pay QRIS
                'coin_amount' => $coinAmount,
                'payment_amount' => $paymentAmount,
                'status' => 'pending',
            ]);

            Log::info('Duitku QRIS transaction created', [
                'transaction_id' => $transaction->id,
                'reference' => $result['reference'] ?? null,
                'has_qr_string' => isset($result['qrString'])
            ]);

            // Return QR string untuk di-render di frontend
            return response()->json([
                'success' => true,
                'message' => 'QRIS payment created successfully',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'merchant_order_id' => $merchantOrderId,
                    'reference' => $result['reference'] ?? null,
                    'qr_string' => $result['qrString'] ?? null, // String untuk generate QR code
                    'amount' => $paymentAmount,
                    'coin_amount' => $coinAmount,
                    'expiry_period' => 60, // minutes
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
     */
    public function handleCallback(Request $request)
    {
        try {
            Log::info('Duitku callback received', $request->all());

            // Get callback parameters
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

            // Validate signature: MD5(merchantCode + amount + merchantOrderId + apiKey)
            $calcSignature = md5($merchantCode . $amount . $merchantOrderId . $this->apiKey);

            if ($signature !== $calcSignature) {
                Log::error('Duitku callback: Invalid signature', [
                    'received' => $signature,
                    'calculated' => $calcSignature
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid signature'
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
            $oldStatus = $transaction->status;
            $newStatus = $resultCode === '00' ? 'success' : 'failed';

            $transaction->update([
                'status' => $newStatus,
                'result_code' => $resultCode,
                'payment_code' => $paymentCode,
                'callback_reference' => $reference,
                'settlement_date' => $settlementDate,
            ]);

            Log::info('Duitku transaction updated', [
                'transaction_id' => $transaction->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'result_code' => $resultCode
            ]);

            // If payment successful, add coins to user
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
     */
    public function checkStatus($merchantOrderId)
    {
        try {
            $transaction = DuitkuTransaction::where('merchant_order_id', $merchantOrderId)->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'merchant_order_id' => $transaction->merchant_order_id,
                    'reference' => $transaction->reference,
                    'status' => $transaction->status,
                    'coin_amount' => $transaction->coin_amount,
                    'payment_amount' => $transaction->payment_amount,
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
}
