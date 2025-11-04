<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceJsonResponse
{
    public function handle(Request $request, Closure $next)
    {
        // Skip middleware for storage routes (images, files, etc.)
        if ($request->is('storage/*')) {
            return $next($request);
        }

        // Force Accept header to JSON for API routes only
        $request->headers->set('Accept', 'application/json');

        $response = $next($request);

        // Ensure Content-Type is set to application/json for API responses only
        if ($request->is('api/*') && $response instanceof Response) {
            // Only set JSON content type if response doesn't already have a specific content type
            $currentContentType = $response->headers->get('Content-Type', '');

            // Don't override if it's already an image, file, or has explicit content type
            if (empty($currentContentType) ||
                (strpos($currentContentType, 'application/json') === false &&
                 strpos($currentContentType, 'image/') === false &&
                 strpos($currentContentType, 'application/octet-stream') === false)) {
                $response->headers->set('Content-Type', 'application/json');
            }
        }

        return $response;
    }
}
