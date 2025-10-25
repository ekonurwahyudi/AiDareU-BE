<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ImageCacheService
{
    private const CACHE_PREFIX = 'image_cache:';
    private const CACHE_TTL = 86400; // 24 hours
    
    /**
     * Get cached image URL or generate new one
     */
    public function getCachedImageUrl(string $businessType, string $imageType, int $width = 800, int $height = 600): string
    {
        $cacheKey = $this->generateCacheKey($businessType, $imageType, $width, $height);
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($businessType, $imageType, $width, $height) {
            return $this->generateImageUrl($businessType, $imageType, $width, $height);
        });
    }
    
    /**
     * Generate consistent image URLs based on business type
     */
    private function generateImageUrl(string $businessType, string $imageType, int $width, int $height): string
    {
        $seed = $this->generateSeed($businessType, $imageType);
        $filters = $this->getImageFilters($businessType, $imageType);
        
        $url = "https://picsum.photos/{$width}/{$height}";
        
        $params = ['seed' => $seed];
        
        // Add filters based on image type
        if ($filters['blur']) {
            $params['blur'] = $filters['blur'];
        }
        
        if ($filters['grayscale']) {
            $params['grayscale'] = '';
        }
        
        $queryString = http_build_query($params);
        
        return $url . '?' . $queryString;
    }
    
    /**
     * Generate consistent seed based on business type and image type
     */
    private function generateSeed(string $businessType, string $imageType): int
    {
        $seeds = [
            'food' => [
                'hero' => 201,
                'product' => 202,
                'logo' => 203,
                'favicon' => 204
            ],
            'retail' => [
                'hero' => 301,
                'product' => 302,
                'logo' => 303,
                'favicon' => 304
            ],
            'service' => [
                'hero' => 401,
                'product' => 402,
                'logo' => 403,
                'favicon' => 404
            ],
            'technology' => [
                'hero' => 501,
                'product' => 502,
                'logo' => 503,
                'favicon' => 504
            ],
            'health' => [
                'hero' => 601,
                'product' => 602,
                'logo' => 603,
                'favicon' => 604
            ],
            'education' => [
                'hero' => 701,
                'product' => 702,
                'logo' => 703,
                'favicon' => 704
            ],
            'default' => [
                'hero' => 101,
                'product' => 102,
                'logo' => 103,
                'favicon' => 104
            ]
        ];
        
        $businessSeeds = $seeds[$businessType] ?? $seeds['default'];
        return $businessSeeds[$imageType] ?? $businessSeeds['hero'];
    }
    
    /**
     * Get image filters based on business type and image type
     */
    private function getImageFilters(string $businessType, string $imageType): array
    {
        $filters = [
            'blur' => null,
            'grayscale' => false
        ];
        
        // Apply blur for logos and favicons
        if (in_array($imageType, ['logo', 'favicon'])) {
            $filters['blur'] = $imageType === 'favicon' ? 2 : 1;
            $filters['grayscale'] = true;
        }
        
        return $filters;
    }
    
    /**
     * Generate cache key for image
     */
    private function generateCacheKey(string $businessType, string $imageType, int $width, int $height): string
    {
        return self::CACHE_PREFIX . md5("{$businessType}_{$imageType}_{$width}_{$height}");
    }
    
    /**
     * Clear all image cache
     */
    public function clearImageCache(): void
    {
        try {
            $keys = Cache::getRedis()->keys(self::CACHE_PREFIX . '*');
            if (!empty($keys)) {
                Cache::getRedis()->del($keys);
            }
            Log::info('Image cache cleared successfully');
        } catch (\Exception $e) {
            Log::error('Failed to clear image cache: ' . $e->getMessage());
        }
    }
    
    /**
     * Get cache statistics
     */
    public function getCacheStats(): array
    {
        try {
            $keys = Cache::getRedis()->keys(self::CACHE_PREFIX . '*');
            return [
                'total_cached_images' => count($keys),
                'cache_prefix' => self::CACHE_PREFIX,
                'cache_ttl' => self::CACHE_TTL
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get cache stats: ' . $e->getMessage());
            return [
                'total_cached_images' => 0,
                'cache_prefix' => self::CACHE_PREFIX,
                'cache_ttl' => self::CACHE_TTL,
                'error' => $e->getMessage()
            ];
        }
    }
}