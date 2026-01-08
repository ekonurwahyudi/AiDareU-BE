<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('database.default') === 'pgsql') {
            Schema::defaultStringLength(191);
        }

        // Configure Rate Limiting untuk keamanan
        $this->configureRateLimiting();
    }

    /**
     * Configure rate limiting untuk berbagai endpoint
     */
    protected function configureRateLimiting(): void
    {
        // Rate limit untuk API umum: 60 requests per menit
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limit ketat untuk authentication: 5 attempts per menit
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.'
                ], 429);
            });
        });

        // Rate limit untuk registrasi: 3 per jam per IP
        RateLimiter::for('register', function (Request $request) {
            return Limit::perHour(3)->by($request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak percobaan registrasi. Silakan coba lagi nanti.'
                ], 429);
            });
        });

        // Rate limit untuk password reset: 3 per jam
        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perHour(3)->by($request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak permintaan reset password. Silakan coba lagi nanti.'
                ], 429);
            });
        });

        // Rate limit untuk payment: 10 per menit per user
        RateLimiter::for('payment', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak permintaan pembayaran. Silakan coba lagi dalam 1 menit.'
                ], 429);
            });
        });

        // Rate limit untuk AI generation: 20 per menit per user
        RateLimiter::for('ai-generation', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak permintaan AI. Silakan coba lagi dalam 1 menit.'
                ], 429);
            });
        });

        // Rate limit untuk upload: 30 per menit
        RateLimiter::for('upload', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak upload. Silakan coba lagi dalam 1 menit.'
                ], 429);
            });
        });

        // Rate limit untuk OTP/verification: 5 per 10 menit
        RateLimiter::for('otp', function (Request $request) {
            return Limit::perMinutes(10, 5)->by($request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak permintaan kode verifikasi. Silakan coba lagi dalam 10 menit.'
                ], 429);
            });
        });

        // Rate limit untuk callback payment (dari Duitku): 100 per menit
        RateLimiter::for('payment-callback', function (Request $request) {
            return Limit::perMinute(100)->by($request->ip());
        });
    }
}
