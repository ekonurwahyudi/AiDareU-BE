<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use App\Mail\VerificationCodeMail;

class AuthController extends Controller
{
    /**
     * Register new user
     */
    public function register(Request $request): JsonResponse
    {
        \Log::info('Registration attempt', ['data' => $request->all()]);
        
        $validator = Validator::make($request->all(), [
            'nama_lengkap' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'no_hp' => 'required|string|min:10|max:15',
            'password' => 'required|string|min:8',
            'alasan_gabung' => 'required|string|min:10|max:1000',
            'info_dari' => 'required|in:sosial_media,grup_komunitas,iklan,google,teman_saudara,lainnya'
        ], [
            'email.unique' => 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
            'password.regex' => 'Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, 1 angka, dan 1 simbol (@$!%*?&).',
            'no_hp.regex' => 'Format nomor HP tidak valid. Contoh: 081234567890',
        ]);

        if ($validator->fails()) {
            \Log::error('Registration validation failed', ['errors' => $validator->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Create user
            $user = User::create([
                'name' => $request->nama_lengkap,
                'nama_lengkap' => $request->nama_lengkap,
                'email' => $request->email,
                'no_hp' => $request->no_hp,
                'password' => Hash::make($request->password),
                'alasan_gabung' => $request->alasan_gabung,
                'info_dari' => $request->info_dari,
                'is_active' => true,
                'paket' => 'Freemium',
            ]);

            // Generate and send verification code
            $verificationCode = $user->generateEmailVerificationCode();
            
            // Send verification email
            \Log::info('About to send email', ['email' => $user->email, 'code' => $verificationCode]);
            try {
                Mail::to($user->email)->send(new VerificationCodeMail($verificationCode));
                \Log::info('Email sent successfully', ['email' => $user->email, 'code' => $verificationCode]);
            } catch (\Exception $mailError) {
                \Log::error('Failed to send email', ['email' => $user->email, 'error' => $mailError->getMessage(), 'trace' => $mailError->getTraceAsString()]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Registration successful. Please check your email for verification code.',
                'data' => [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'verification_code' => $verificationCode // Remove in production
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify email with code
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|size:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();
            
            if ($user->verifyEmailWithCode($request->code)) {
                // Assign default role (owner for new registrations)
                $user->assignRole('owner');

                // Generate token
                $token = $user->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'message' => 'Email verified successfully',
                    'data' => [
                        'user' => $user->load(['roles']),
                        'token' => $token
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired verification code'
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Verification failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resend verification code
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();
            
            if ($user->email_verified_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email already verified'
                ], 400);
            }

            $verificationCode = $user->generateEmailVerificationCode();
            
            // Send verification email - RESEND METHOD
            \Log::info('RESEND: About to send email', ['email' => $user->email, 'code' => $verificationCode]);
            try {
                $mail = new VerificationCodeMail($verificationCode);
                \Log::info('RESEND: Mail object created', ['email' => $user->email, 'code_in_mail' => $mail->verificationCode]);
                Mail::to($user->email)->send($mail);
                \Log::info('RESEND: Email sent successfully', ['email' => $user->email, 'code' => $verificationCode]);
            } catch (\Exception $mailError) {
                \Log::error('RESEND: Failed to send email', ['email' => $user->email, 'error' => $mailError->getMessage(), 'trace' => $mailError->getTraceAsString()]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent successfully',
                'data' => [
                    'verification_code' => $verificationCode // Remove in production
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification code',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required','email'],
            'password' => ['required','string','min:5'],
        ]);

        // Attempt login via session guard
        if (!Auth::attempt(['email' => $data['email'], 'password' => $data['password']])) {
            return response()->json(['message' => ['Invalid credentials']], 401);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        // Load store relation
        $user->load('stores');

        // Get first store if exists
        $store = $user->stores->first();

        // Buat token untuk API calls
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'name' => $user->name ?? 'User',
                'email' => $user->email,
                'store' => $store ? [
                    'uuid' => $store->uuid,
                    'nama_toko' => $store->name ?? $store->nama_toko,
                    'slug' => $store->subdomain ?? null,
                    'logo' => $store->logo,
                ] : null,
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        // Revoke current token if using Sanctum token auth
        if ($request->user() && method_exists($request->user(), 'currentAccessToken')) {
            $token = $request->user()->currentAccessToken();
            if ($token) {
                $token->delete();
            }
        }

        // Logout of web session
        \Illuminate\Support\Facades\Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()->load(['roles.permissions', 'stores'])
        ]);
    }
}