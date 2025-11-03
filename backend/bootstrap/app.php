<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use App\Http\Middleware\CompressResponse;
use App\Http\Middleware\ForceJsonResponse;

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

        // Force JSON response for API routes (after CORS)
        $middleware->append(ForceJsonResponse::class);

        // Add response compression for API routes
        $middleware->appendToGroup('api', CompressResponse::class);

        // Disable CSRF protection for API endpoints since we're using session-based API auth from frontend
        // For production, prefer Sanctum + CSRF cookie flow instead of disabling globally.
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
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated. Please login first.',
                ], 401);
            }
        });

        // Ensure all API exceptions return JSON with CORS headers
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*')) {
                $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

                $response = response()->json([
                    'success' => false,
                    'message' => app()->environment('production') ? 'Server error' : $e->getMessage(),
                    'error' => app()->environment('local') ? [
                        'message' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ] : null
                ], $statusCode);

                // Ensure CORS headers are present
                $origin = $request->header('Origin');
                if ($origin) {
                    $response->headers->set('Access-Control-Allow-Origin', $origin);
                    $response->headers->set('Access-Control-Allow-Credentials', 'true');
                    $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
                    $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-UUID, Accept');
                }

                return $response;
            }
        });
    })->create();