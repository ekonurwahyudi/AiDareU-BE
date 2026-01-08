<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class SecurityLogger
{
    /**
     * Security-sensitive endpoints to monitor
     */
    protected array $sensitiveEndpoints = [
        'auth/login',
        'auth/register',
        'auth/forgot-password',
        'auth/reset-password',
        'payment/duitku',
        'rbac',
        'management/users',
    ];

    /**
     * Handle an incoming request and log security events.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Log failed authentication attempts
        if ($response->getStatusCode() === 401 || $response->getStatusCode() === 403) {
            $this->logSecurityEvent('auth_failure', $request, $response);
        }

        // Log rate limit hits
        if ($response->getStatusCode() === 429) {
            $this->logSecurityEvent('rate_limit_exceeded', $request, $response);
        }

        // Log access to sensitive endpoints
        if ($this->isSensitiveEndpoint($request)) {
            $this->logSecurityEvent('sensitive_access', $request, $response);
        }

        // Log suspicious patterns
        if ($this->hasSuspiciousPatterns($request)) {
            $this->logSecurityEvent('suspicious_request', $request, $response);
        }

        return $response;
    }

    /**
     * Check if request is to a sensitive endpoint
     */
    protected function isSensitiveEndpoint(Request $request): bool
    {
        foreach ($this->sensitiveEndpoints as $endpoint) {
            if ($request->is("api/{$endpoint}*")) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check for suspicious patterns in request
     */
    protected function hasSuspiciousPatterns(Request $request): bool
    {
        $suspiciousPatterns = [
            // SQL Injection patterns
            '/(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b.*\bwhere\b)/i',
            // XSS patterns
            '/<script[^>]*>.*<\/script>/i',
            // Path traversal
            '/\.\.\//',
            // Command injection
            '/[;&|`$]/',
        ];

        $input = json_encode($request->all());
        $url = $request->fullUrl();

        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $input) || preg_match($pattern, $url)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Log security event
     */
    protected function logSecurityEvent(string $type, Request $request, Response $response): void
    {
        Log::channel('security')->warning("Security Event: {$type}", [
            'type' => $type,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'user_id' => $request->user()?->id,
            'status_code' => $response->getStatusCode(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
