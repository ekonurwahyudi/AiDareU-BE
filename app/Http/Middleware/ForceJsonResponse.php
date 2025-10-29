<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForceJsonResponse
{
    public function handle(Request $request, Closure $next)
    {
        $request->headers->set('Accept', 'application/json');
        
        $response = $next($request);
        
        // Ensure CORS headers are present for API routes
        if ($request->is('api/*')) {
            $origin = $request->header('Origin');
            
            // Check if origin matches allowed patterns
            if ($this->isAllowedOrigin($origin)) {
                $response->headers->set('Access-Control-Allow-Origin', $origin);
                $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
                $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-UUID, Accept');
                $response->headers->set('Access-Control-Allow-Credentials', 'true');
                $response->headers->set('Access-Control-Max-Age', '86400');
            }
        }
        
        return $response;
    }
    
    private function isAllowedOrigin(?string $origin): bool
    {
        if (!$origin) {
            return false;
        }
        
        $allowedPatterns = [
            '/^https?:\/\/localhost(:\d+)?$/i',
            '/^https?:\/\/127\.0\.0\.1(:\d+)?$/i',
            '/^https:\/\/([a-z0-9-]+\.)?aidareu\.com$/i',
        ];
        
        foreach ($allowedPatterns as $pattern) {
            if (preg_match($pattern, $origin)) {
                return true;
            }
        }
        
        return false;
    }
}
