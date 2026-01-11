<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoinTransaction;
use App\Models\DuitkuTransaction;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class DuitkuController extends Controller
{
    private $merchantCode;
    private $apiKey;
    private $sandboxMode;

    /**
     * Duitku IP Whitelist (Production & Sandbox)
     * Source: https://docs.duitku.com/api/id/#callback
     */
    private $duitkuIpWhitelist = [
        // Production IPs
        '103.10.128.11',
        '103.10.128.14',
        // Sandbox IPs
        '103.10.129.11',
        '103.10.129.14',
        // Localhost for testing
        '127.0.0.1',
    ];

    public function __construct()
    {
        $this->merchantCode = env('DUITKU_MERCHANT_CODE');
        $this->apiKey = env('DUITKU_API_KEY');
        $this->sandboxMode = filter_var(env('DUITKU_SANDBOX', false), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Validate if request IP is from Duitku
     */
    private function isValidDuitkuIp(Request $request): bool
    {
        $clientIp = $request->ip();
        
        // In sandbox mode, allow more IPs for testing
        if ($this->sandboxMode) {
            return true; // Allow all IPs in sandbox for easier testing
        }

        // Check against whitelist
        if (in_array($clientIp, $this->duitkuIpWhitelist)) {
            return true;
        }

        // Check X-Forwarded-For header (for load balancers)
        $forwardedFor = $request->header('X-Forwarded-For');
        if ($forwardedFor) {
            $ips = array_map('trim', explode(',', $forwardedFor));
            foreach ($ips as $ip) {
                if (in_array($ip, $this->duitkuIpWhitelist)) {
                    return true;
                }
            }
        }

        Log::warning('Duitku callback from unauthorized IP', [
            'client_ip' => $clientIp,
            'forwarded_for' => $forwardedFor,
        ]);

        return false;
    }

    /**
     * Generate secure merchant order ID
     */
    private function generateSecureMerchantOrderId(): string
    {
        // Format: AIDUTP + timestamp + random secure string
        return 'AIDUTP' . time() . Str::random(8);
    }

    /**
     * Create Duitku payment transaction
     * POST /api/payment/duitku/create
     * 
     * SECURITY:
     * - Requires authentication
     * - Rate limited (10/min per user)
     * - Idempotency check to prevent duplicate transactions
     */
    public function createPayment(Request $request)
    {
        try {
            $request->validate([
                'coin_amount' => 'required|integer|min:1|max:10000', // Max 10,000 coins per transaction
                'payment_method' => 'nullable|string|max:2',
                'idempotency_key' => 'nullable|string|max:64', // Optional idempotency key
            ]);

            /** @var \App\Models\User|null $user */
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Idempotency check - prevent duplicate transactions
            $idempotencyKey = $request->idempotency_key;
            if ($idempotencyKey) {
                $cacheKey = "payment_idempotency:{$user->id}:{$idempotencyKey}";
                $existingTransaction = Cache::get($cacheKey);
                
                if ($existingTransaction) {
                    Log::info('Duplicate payment request blocked', [
                        'user_id' => $user->id,
                        'idempotency_key' => $idempotencyKey,
                    ]);
                    
                    return response()->json([
                        'success' => true,
                        'message' => 'Payment already created',
                        'data' => $existingTransaction,
                    ]);
                }
            }

            // Check for pending transactions (prevent spam)
            $pendingCount = DuitkuTransaction::where('user_id', $user->id)
                ->where('status', 'pending')
                ->where('created_at', '>', now()->subHour())
                ->count();

            if ($pendingCount >= 5) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda memiliki terlalu banyak transaksi pending. Silakan selesaikan atau tunggu transaksi sebelumnya.'
                ], 429);
            }

            $coinAmount = $request->coin_amount;
            $paymentAmount = $coinAmount * 1000;
            $paymentMethod = $request->payment_method ?? 'SP';
            $merchantOrderId = $this->generateSecureMerchantOrderId();
            $signature = md5($this->merchantCode . $merchantOrderId . $paymentAmount . $this->apiKey);

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
                'customerVaName' => substr($user->name ?? 'User', 0, 20),
                'callbackUrl' => url('/api/payment/duitku/callback'),
                'returnUrl' => env('APP_FRONTEND_URL', 'https://aidareu.com') . '/apps/user/coin',
                'signature' => $signature,
                'expiryPeriod' => 60,
                'itemDetails' => [
                    ['name' => "Top Up {$coinAmount} Coin", 'price' => $paymentAmount, 'quantity' => 1]
                ],
                'customerDetail' => [
                    'firstName' => $user->name ?? 'User',
                    'lastName' => '',
                    'email' => $user->email,
                    'phoneNumber' => $user->phone ?? '',
                ],
            ];

            $endpoint = $this->sandboxMode
                ? 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry'
                : 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry';

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post($endpoint, $requestData);

            if (!$response->successful()) {
                $errorBody = $response->json();
                return response()->json([
                    'success' => false,
                    'message' => $errorBody['Message'] ?? $errorBody['statusMessage'] ?? 'Payment gateway error'
                ], 500);
            }

            $result = $response->json();

            if (!isset($result['statusCode']) || $result['statusCode'] !== '00') {
                return response()->json([
                    'success' => false,
                    'message' => $result['statusMessage'] ?? 'Transaction failed'
                ], 400);
            }

            // Save transaction
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

            // Send payment reminder email
            $this->sendPaymentReminderEmail($user, $transaction, $paymentAmount, $coinAmount);

            $responseData = [
                'transaction_id' => $transaction->id,
                'merchant_order_id' => $merchantOrderId,
                'reference' => $result['reference'] ?? null,
                'payment_url' => $result['paymentUrl'] ?? null,
                'va_number' => $result['vaNumber'] ?? null,
                'qr_string' => $result['qrString'] ?? null,
                'amount' => $paymentAmount,
                'coin_amount' => $coinAmount,
            ];

            // Store idempotency key for 1 hour
            if ($idempotencyKey) {
                Cache::put($cacheKey, $responseData, now()->addHour());
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment created successfully',
                'data' => $responseData
            ]);

        } catch (\Exception $e) {
            Log::error('Duitku createPayment error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Send payment reminder email
     */
    private function sendPaymentReminderEmail($user, $transaction, $paymentAmount, $coinAmount)
    {
        try {
            $paymentUrl = $transaction->payment_url;
            
            Mail::send([], [], function ($message) use ($user, $transaction, $paymentAmount, $coinAmount, $paymentUrl) {
                $message->to($user->email, $user->name)
                    ->subject('🔔 Segera Selesaikan Pembayaran Top Up Coin - AiDareU')
                    ->html("
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                            <div style='text-align: center; margin-bottom: 30px;'>
                                <h1 style='color: #f59e0b; margin: 0;'>AiDareU</h1>
                            </div>
                            
                            <h2 style='color: #333;'>Halo {$user->name}! 👋</h2>
                            
                            <p style='color: #666; font-size: 16px;'>
                                Anda memiliki transaksi top up coin yang menunggu pembayaran.
                            </p>
                            
                            <div style='background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 20px; margin: 20px 0;'>
                                <h3 style='color: #C2410C; margin-top: 0;'>📋 Detail Transaksi</h3>
                                <table style='width: 100%; border-collapse: collapse;'>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Order ID</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: bold;'>{$transaction->merchant_order_id}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Jumlah Coin</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: bold;'>{$coinAmount} Pts</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Total Pembayaran</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: bold; color: #f59e0b; font-size: 18px;'>Rp " . number_format($paymentAmount, 0, ',', '.') . "</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style='background: #FEF3C7; border-radius: 8px; padding: 15px; margin: 20px 0;'>
                                <p style='color: #92400E; margin: 0; font-weight: bold;'>
                                    ⏰ Pembayaran akan kadaluarsa dalam 60 menit!
                                </p>
                            </div>
                            
                            <p style='color: #666; font-size: 14px;'>
                                Segera selesaikan pembayaran Anda menggunakan QRIS melalui aplikasi e-wallet favorit Anda (GoPay, OVO, Dana, ShopeePay, dll).
                            </p>
                            
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='{$paymentUrl}' style='background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;'>
                                    💳 Bayar Sekarang
                                </a>
                            </div>
                            
                            <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>
                            
                            <p style='color: #999; font-size: 12px; text-align: center;'>
                                Email ini dikirim otomatis oleh sistem AiDareU.<br>
                                Jika Anda tidak melakukan transaksi ini, abaikan email ini.
                            </p>
                        </div>
                    ");
            });

            Log::info('Payment reminder email sent', ['user_id' => $user->id, 'order_id' => $transaction->merchant_order_id]);
        } catch (\Exception $e) {
            Log::error('Failed to send payment reminder email', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Create notification for successful payment
     */
    private function createPaymentSuccessNotification($user, $transaction)
    {
        try {
            Notification::create([
                'user_uuid' => $user->uuid,
                'type' => 'payment',
                'title' => '✅ Top Up Berhasil!',
                'description' => "Selamat! Top up {$transaction->coin_amount} Coin berhasil. Saldo coin Anda telah bertambah.",
                'data' => [
                    'transaction_id' => $transaction->id,
                    'merchant_order_id' => $transaction->merchant_order_id,
                    'coin_amount' => $transaction->coin_amount,
                    'payment_amount' => $transaction->payment_amount,
                ],
                'icon' => 'tabler-coin',
                'color' => 'success',
                'action_url' => '/apps/user/coin',
                'is_read' => false,
            ]);

            Log::info('Payment success notification created', ['user_id' => $user->id]);
        } catch (\Exception $e) {
            Log::error('Failed to create payment notification', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Send payment success email
     */
    private function sendPaymentSuccessEmail($user, $transaction)
    {
        try {
            $frontendUrl = env('APP_FRONTEND_URL', 'https://aidareu.com');
            $coinAmount = $transaction->coin_amount;
            $paymentAmount = $transaction->payment_amount;
            
            Mail::send([], [], function ($message) use ($user, $transaction, $coinAmount, $paymentAmount, $frontendUrl) {
                $message->to($user->email, $user->name)
                    ->subject('✅ Pembayaran Berhasil - Top Up ' . $coinAmount . ' Coin AiDareU')
                    ->html("
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                            <div style='text-align: center; margin-bottom: 30px;'>
                                <h1 style='color: #f59e0b; margin: 0;'>AiDareU</h1>
                            </div>
                            
                            <div style='text-align: center; margin-bottom: 20px;'>
                                <div style='background: #10B981; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;'>
                                    <span style='font-size: 40px; color: white;'>✓</span>
                                </div>
                            </div>
                            
                            <h2 style='color: #10B981; text-align: center;'>Pembayaran Berhasil! 🎉</h2>
                            
                            <p style='color: #666; font-size: 16px; text-align: center;'>
                                Halo {$user->name}, terima kasih atas pembayaran Anda!
                            </p>
                            
                            <div style='background: #ECFDF5; border: 1px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0;'>
                                <h3 style='color: #059669; margin-top: 0;'>📋 Detail Transaksi</h3>
                                <table style='width: 100%; border-collapse: collapse;'>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Order ID</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: bold;'>{$transaction->merchant_order_id}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Jumlah Coin</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: bold; color: #f59e0b; font-size: 20px;'>+{$coinAmount} Pts</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Total Pembayaran</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: bold;'>Rp " . number_format($paymentAmount, 0, ',', '.') . "</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Status</td>
                                        <td style='padding: 8px 0; text-align: right;'>
                                            <span style='background: #10B981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;'>BERHASIL</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <p style='color: #666; font-size: 14px; text-align: center;'>
                                Coin Anda telah ditambahkan dan siap digunakan untuk fitur AI di AiDareU.
                            </p>
                            
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='{$frontendUrl}/apps/user/coin' style='background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;'>
                                    Lihat Saldo Coin
                                </a>
                            </div>
                            
                            <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>
                            
                            <p style='color: #999; font-size: 12px; text-align: center;'>
                                Terima kasih telah menggunakan AiDareU!<br>
                                Email ini dikirim otomatis oleh sistem.
                            </p>
                        </div>
                    ");
            });

            Log::info('Payment success email sent', ['user_id' => $user->id, 'order_id' => $transaction->merchant_order_id]);
        } catch (\Exception $e) {
            Log::error('Failed to send payment success email', ['error' => $e->getMessage()]);
        }
    }


    /**
     * Handle Duitku payment callback
     * POST /api/payment/duitku/callback
     * Dokumentasi: https://docs.duitku.com/api/id/#callback
     * 
     * SECURITY:
     * - IP whitelist validation (production only)
     * - Signature validation
     * - Database transaction with locking to prevent race conditions
     * 
     * Content-Type: x-www-form-urlencoded
     */
    public function handleCallback(Request $request)
    {
        try {
            Log::info('Duitku callback received', [
                'data' => $request->all(),
                'ip' => $request->ip(),
            ]);

            // SECURITY: Validate IP is from Duitku
            if (!$this->isValidDuitkuIp($request)) {
                Log::error('Duitku callback: Unauthorized IP', [
                    'ip' => $request->ip(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

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

            // Use database transaction with pessimistic locking to prevent race conditions
            $result = DB::transaction(function () use ($merchantOrderId, $resultCode, $paymentCode, $reference, $settlementDate, $publisherOrderId, $issuerCode, $amount) {
                // Lock the transaction row for update
                $transaction = DuitkuTransaction::where('merchant_order_id', $merchantOrderId)
                    ->lockForUpdate()
                    ->first();

                if (!$transaction) {
                    Log::error('Duitku callback: Transaction not found', [
                        'merchant_order_id' => $merchantOrderId
                    ]);
                    return ['error' => 'Transaction not found', 'code' => 404];
                }

                // Validate amount matches
                if ((int)$amount !== (int)$transaction->payment_amount) {
                    Log::error('Duitku callback: Amount mismatch', [
                        'expected' => $transaction->payment_amount,
                        'received' => $amount,
                    ]);
                    return ['error' => 'Amount mismatch', 'code' => 400];
                }

                // Check if already processed
                $oldStatus = $transaction->status;
                if ($oldStatus === 'success') {
                    Log::info('Duitku callback: Transaction already processed', [
                        'merchant_order_id' => $merchantOrderId
                    ]);
                    return ['success' => true, 'already_processed' => true];
                }

                // Update transaction status
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

                // If payment successful, add coins to user
                if ($resultCode === '00') {
                    $user = User::find($transaction->user_id);

                    if ($user) {
                        // Double-check no existing coin transaction (idempotency)
                        $existingCoin = CoinTransaction::where('keterangan', 'LIKE', "%{$merchantOrderId}%")->first();
                        
                        if (!$existingCoin) {
                            // Create coin transaction
                            CoinTransaction::create([
                                'uuid_user' => $user->uuid,
                                'keterangan' => "Top Up via Duitku - {$transaction->merchant_order_id}",
                                'coin_masuk' => $transaction->coin_amount,
                                'coin_keluar' => 0,
                                'status' => 'berhasil',
                            ]);

                            // Create success notification
                            $this->createPaymentSuccessNotification($user, $transaction);

                            // Send success email
                            $this->sendPaymentSuccessEmail($user, $transaction);

                            Log::info('Coins added to user', [
                                'user_id' => $user->id,
                                'coin_amount' => $transaction->coin_amount
                            ]);
                        } else {
                            Log::warning('Coin transaction already exists', [
                                'merchant_order_id' => $merchantOrderId
                            ]);
                        }
                    }
                }

                return ['success' => true];
            });

            // Handle transaction result
            if (isset($result['error'])) {
                return response()->json([
                    'success' => false,
                    'message' => $result['error']
                ], $result['code']);
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
     * 
     * SECURITY:
     * - Requires authentication
     * - User can only check their own transactions
     * - Database transaction with locking for coin addition
     */
    public function checkStatus($merchantOrderId)
    {
        try {
            /** @var \App\Models\User|null $user */
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // First check local database - SECURITY: Only allow user to check their own transactions
            $transaction = DuitkuTransaction::where('merchant_order_id', $merchantOrderId)
                ->where('user_id', $user->id) // CRITICAL: Ownership validation
                ->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            // If already success, return immediately without API call
            if ($transaction->status === 'success') {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'merchant_order_id' => $transaction->merchant_order_id,
                        'reference' => $transaction->reference,
                        'status' => $transaction->status,
                        'api_status_code' => '00',
                        'coin_amount' => $transaction->coin_amount,
                        'payment_amount' => $transaction->payment_amount,
                        'payment_url' => $transaction->payment_url,
                        'created_at' => $transaction->created_at->toDateTimeString(),
                    ]
                ]);
            }

            // Check status from Duitku API
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
                
                // Update local status if different - use transaction with locking
                // statusCode: 00 = Success, 01 = Pending, 02 = Canceled
                if ($apiStatus === '00' && $transaction->status !== 'success') {
                    DB::transaction(function () use ($transaction, $merchantOrderId, $user) {
                        // Re-fetch with lock
                        $lockedTransaction = DuitkuTransaction::where('id', $transaction->id)
                            ->lockForUpdate()
                            ->first();

                        if ($lockedTransaction->status === 'success') {
                            return; // Already processed
                        }

                        $lockedTransaction->update(['status' => 'success']);
                        
                        // Add coins if not already added
                        $existingCoin = CoinTransaction::where('keterangan', 'LIKE', "%{$merchantOrderId}%")->first();
                        if (!$existingCoin) {
                            CoinTransaction::create([
                                'uuid_user' => $user->uuid,
                                'keterangan' => "Top Up via Duitku - {$merchantOrderId}",
                                'coin_masuk' => $lockedTransaction->coin_amount,
                                'coin_keluar' => 0,
                                'status' => 'berhasil',
                            ]);

                            // Create success notification
                            $this->createPaymentSuccessNotification($user, $lockedTransaction);

                            // Send success email
                            $this->sendPaymentSuccessEmail($user, $lockedTransaction);
                        }
                    });

                    // Refresh transaction
                    $transaction->refresh();
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
