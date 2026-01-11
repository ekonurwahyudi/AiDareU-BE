<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoinTransaction;
use App\Models\DuitkuTransaction;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class DuitkuController extends Controller
{
    private $merchantCode;
    private $apiKey;
    private $sandboxMode;

    public function __construct()
    {
        $this->merchantCode = env('DUITKU_MERCHANT_CODE');
        $this->apiKey = env('DUITKU_API_KEY');
        $this->sandboxMode = filter_var(env('DUITKU_SANDBOX', false), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Create Duitku payment transaction
     * POST /api/payment/duitku/create
     */
    public function createPayment(Request $request)
    {
        try {
            $request->validate([
                'coin_amount' => 'required|integer|min:1',
                'payment_method' => 'nullable|string|max:2',
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
            $paymentAmount = $coinAmount * 1000;
            $paymentMethod = $request->payment_method ?? 'SP';
            $merchantOrderId = 'AIDUTP' . time() . rand(100, 999);
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

                    // Create success notification
                    $this->createPaymentSuccessNotification($user, $transaction);

                    // Send success email
                    $this->sendPaymentSuccessEmail($user, $transaction);

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

                            // Create success notification
                            $this->createPaymentSuccessNotification($user, $transaction);

                            // Send success email
                            $this->sendPaymentSuccessEmail($user, $transaction);
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
