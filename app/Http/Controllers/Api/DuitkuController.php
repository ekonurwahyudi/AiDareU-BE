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
    private $merchantCode = 'D21180';
    private $apiKey;
    private $sandboxMode = true; // Set false untuk production

    public function __construct()
    {
        $this->apiKey = env('DUITKU_API_KEY');
        $this->sandboxMode = env('DUITKU_SANDBOX', true);
    }

    /**
     * Create Duitku payment transaction (Pop-up)
     * POST /api/payment/duitku/create
     * Sesuai dokumentasi: https://docs.duitku.com/pop/id/#integrasi-backend-atau-server
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

            // Generate timestamp (Jakarta timezone, milliseconds) - UNIX timestamp in milliseconds
            $timestamp = round(microtime(true) * 1000);

            // Generate signature: SHA256(merchantCode + timestamp + apiKey)
            // Sesuai dokumentasi Duitku: "Parameter yang berisi hash adalah merchant code, timestamp, kemudian API key dan harus berurutan"
            // TANPA separator/dash
            $signatureString = $this->merchantCode . $timestamp . $this->apiKey;
            $signature = hash('sha256', $signatureString);

            Log::info('Duitku signature generation', [
                'merchant_code' => $this->merchantCode,
                'timestamp' => $timestamp,
                'signature_string' => $this->merchantCode . $timestamp . '***API_KEY***',
                'signature' => $signature
            ]);

            // Prepare request data for createInvoice sesuai dokumentasi
            $requestData = [
                'paymentAmount' => $paymentAmount,
                'merchantOrderId' => $merchantOrderId,
                'productDetails' => "Top Up {$coinAmount} Coin AiDareU",
                'additionalParam' => '',
                'merchantUserInfo' => $user->email,
                'customerVaName' => $user->name ?? 'User',
                'email' => $user->email,
                'phoneNumber' => $user->phone ?? '',
                'itemDetails' => [
                    [
                        'name' => "Top Up {$coinAmount} Coin",
                        'price' => $paymentAmount,
                        'quantity' => 1
                    ]
                ],
                'customerDetail' => [
                    'firstName' => $user->name ?? 'User',
                    'lastName' => '',
                    'email' => $user->email,
                    'phoneNumber' => $user->phone ?? '',
                ],
                'callbackUrl' => url('/api/payment/duitku/callback'),
                'returnUrl' => env('APP_FRONTEND_URL', 'https://aidareu.com') . '/apps/tokoku/coin-history',
                'expiryPeriod' => 60, // 60 minutes expiry
            ];

            Log::info('Duitku payment request', [
                'user_id' => $user->id,
                'coin_amount' => $coinAmount,
                'payment_amount' => $paymentAmount,
                'order_id' => $merchantOrderId,
                'timestamp' => $timestamp,
                'sandbox_mode' => $this->sandboxMode,
                'request_data' => $requestData
            ]);

            // Call Duitku createInvoice API (lowercase 'createinvoice' sesuai dokumentasi)
            $endpoint = $this->sandboxMode
                ? 'https://api-sandbox.duitku.com/api/merchant/createinvoice'
                : 'https://api-prod.duitku.com/api/merchant/createinvoice';

            Log::info('Duitku API call', [
                'endpoint' => $endpoint,
                'headers' => [
                    'x-duitku-signature' => $signature,
                    'x-duitku-timestamp' => $timestamp,
                    'x-duitku-merchantcode' => $this->merchantCode,
                ]
            ]);

            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'x-duitku-signature' => $signature,
                'x-duitku-timestamp' => (string) $timestamp,
                'x-duitku-merchantcode' => $this->merchantCode,
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

            // Check if response is successful
            if (!isset($result['reference'])) {
                Log::error('Duitku transaction failed - no reference', [
                    'response' => $result
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $result['Message'] ?? $result['statusMessage'] ?? 'Transaction failed'
                ], 400);
            }

            // Save transaction to database
            $transaction = DuitkuTransaction::create([
                'user_id' => $user->id,
                'merchant_order_id' => $merchantOrderId,
                'reference' => $result['reference'],
                'payment_method' => 'POP', // Pop-up method
                'coin_amount' => $coinAmount,
                'payment_amount' => $paymentAmount,
                'status' => 'pending',
            ]);

            Log::info('Duitku transaction created', [
                'transaction_id' => $transaction->id,
                'reference' => $result['reference']
            ]);

            // Return reference for pop-up checkout
            return response()->json([
                'success' => true,
                'message' => 'Payment created successfully',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'merchant_order_id' => $merchantOrderId,
                    'reference' => $result['reference'], // This is the DUITKU_REFERENCE for pop-up
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
