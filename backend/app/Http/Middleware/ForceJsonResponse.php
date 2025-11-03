<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceJsonResponse
{
    public function handle(Request $request, Closure $next)
    {
        // Force Accept header to JSON for API routes
        $request->headers->set('Accept', 'application/json');

        $response = $next($request);

        // Ensure Content-Type is set to application/json for API responses
        if ($request->is('api/*') && $response instanceof Response) {
            if (!$response->headers->has('Content-Type') ||
                strpos($response->headers->get('Content-Type'), 'application/json') === false) {
                $response->headers->set('Content-Type', 'application/json');
            }
        }

        return $response;
    }
}
