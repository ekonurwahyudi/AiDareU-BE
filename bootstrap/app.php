<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use App\Http\Middleware\CompressResponse;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SecurityLogger;
// use App\Http\Middleware\ForceJsonResponse; // DISABLED: Causes issues with subdomain routing

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',   // harus ada
        commands: __DIR__.'/../routes/console.php',
        health: __DIR__.'/../routes/health.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Enable CORS with highest priority using config/cors.php
        $middleware->prepend(HandleCors::class);

        // Add security headers to all responses
        $middleware->append(SecurityHeaders::class);

        // Add compression for API routes only
        $middleware->appendToGroup('api', CompressResponse::class);
        
        // Add security logging for API routes
        $middleware->appendToGroup('api', SecurityLogger::class);

        // Disable CSRF protection for API endpoints since we're using session-based API auth from frontend
        // SECURITY NOTE: API routes are protected by:
        // 1. Rate limiting (throttle middleware)
        // 2. Authentication (auth:web,sanctum middleware)
        // 3. Security logging (SecurityLogger middleware)
        $middleware->validateCsrfTokens(
            except: [
                'api/*',
            ]
        );

        // Avoid redirecting unauthenticated API requests to a non-existent login route
        // This ensures a 401 JSON response instead of trying to resolve Route [login]
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Return JSON for unauthenticated API requests instead of redirect
        // IMPORTANT: This only handles AuthenticationException, not all 401s
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                \Illuminate\Support\Facades\Log::warning('AuthenticationException caught', [
                    'url' => $request->fullUrl(),
                    'guards' => $e->guards(),
                    'message' => $e->getMessage(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated. Please login first.',
                    'debug' => config('app.debug') ? [
                        'guards' => $e->guards(),
                        'exception' => $e->getMessage(),
                    ] : null,
                ], 401);
            }
        });
    })->create();