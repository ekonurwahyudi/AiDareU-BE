<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CompressResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only compress if client accepts gzip encoding
        if (!$this->shouldCompress($request, $response)) {
            return $response;
        }

        // Get response content
        $content = $response->getContent();
        
        // Only compress if content is large enough to benefit
        if (strlen($content) < 1024) {
            return $response;
        }

        // Compress the content
        $compressedContent = gzencode($content, 6); // Level 6 for good compression/speed balance
        
        if ($compressedContent === false) {
            return $response; // Return original if compression fails
        }

        // Set compressed content and headers
        $response->setContent($compressedContent);
        $response->headers->set('Content-Encoding', 'gzip');
        $response->headers->set('Content-Length', strlen($compressedContent));
        $response->headers->set('Vary', 'Accept-Encoding');
        
        // Add cache headers for better performance
        if ($this->isApiResponse($request)) {
            $response->headers->set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
        }

        return $response;
    }

    /**
     * Determine if the response should be compressed
     */
    private function shouldCompress(Request $request, $response): bool
    {
        // Check if client accepts gzip
        $acceptEncoding = $request->header('Accept-Encoding', '');
        if (strpos($acceptEncoding, 'gzip') === false) {
            return false;
        }

        // Don't compress binary responses
        if ($response instanceof BinaryFileResponse || $response instanceof StreamedResponse) {
            return false;
        }

        // Check content type
        $contentType = $response->headers->get('Content-Type', '');
        $compressibleTypes = [
            'application/json',
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
            'text/xml',
            'application/xml'
        ];

        foreach ($compressibleTypes as $type) {
            if (strpos($contentType, $type) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if this is an API response
     */
    private function isApiResponse(Request $request): bool
    {
        return strpos($request->getPathInfo(), '/api/') === 0;
    }
}