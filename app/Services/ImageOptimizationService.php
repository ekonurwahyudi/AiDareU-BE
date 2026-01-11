<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageOptimizationService
{
    /**
     * Convert and optimize image to WebP format
     * 
     * @param UploadedFile $image
     * @param string $directory
     * @param int $quality WebP quality (0-100)
     * @param int|null $maxWidth Maximum width (null = no resize)
     * @return string|null Path to saved image
     */
    public function convertToWebP(
        UploadedFile $image, 
        string $directory = 'products', 
        int $quality = 80,
        ?int $maxWidth = 1200
    ): ?string {
        try {
            // Get image info
            $originalExtension = strtolower($image->getClientOriginalExtension());
            $mimeType = $image->getMimeType();
            
            // Check if it's a valid image
            if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'])) {
                // Not a supported image, store as-is
                return $this->storeOriginal($image, $directory);
            }
            
            // If already WebP or AVIF, just store it (already optimized)
            if (in_array($originalExtension, ['webp', 'avif'])) {
                return $this->storeOriginal($image, $directory);
            }
            
            // Create image resource based on type
            $sourceImage = $this->createImageResource($image->getPathname(), $mimeType);
            
            if (!$sourceImage) {
                // Fallback to original if can't process
                return $this->storeOriginal($image, $directory);
            }
            
            // Get original dimensions
            $originalWidth = imagesx($sourceImage);
            $originalHeight = imagesy($sourceImage);
            
            // Calculate new dimensions if resize needed
            $newWidth = $originalWidth;
            $newHeight = $originalHeight;
            
            if ($maxWidth && $originalWidth > $maxWidth) {
                $ratio = $maxWidth / $originalWidth;
                $newWidth = $maxWidth;
                $newHeight = (int) ($originalHeight * $ratio);
            }
            
            // Create new image with proper dimensions
            $newImage = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG
            if ($mimeType === 'image/png') {
                imagealphablending($newImage, false);
                imagesavealpha($newImage, true);
                $transparent = imagecolorallocatealpha($newImage, 255, 255, 255, 127);
                imagefilledrectangle($newImage, 0, 0, $newWidth, $newHeight, $transparent);
            }
            
            // Resize image
            imagecopyresampled(
                $newImage, $sourceImage,
                0, 0, 0, 0,
                $newWidth, $newHeight,
                $originalWidth, $originalHeight
            );
            
            // Generate unique filename with .webp extension
            $filename = Str::uuid() . '.webp';
            $relativePath = $directory . '/' . $filename;
            $fullPath = storage_path('app/public/' . $relativePath);
            
            // Ensure directory exists
            $dirPath = dirname($fullPath);
            if (!is_dir($dirPath)) {
                mkdir($dirPath, 0755, true);
            }
            
            // Convert to WebP
            $success = imagewebp($newImage, $fullPath, $quality);
            
            // Free memory
            imagedestroy($sourceImage);
            imagedestroy($newImage);
            
            if ($success) {
                return $relativePath;
            }
            
            // Fallback to original if WebP conversion fails
            return $this->storeOriginal($image, $directory);
            
        } catch (\Exception $e) {
            \Log::error('Image optimization failed: ' . $e->getMessage());
            // Fallback to original storage
            return $this->storeOriginal($image, $directory);
        }
    }
    
    /**
     * Create GD image resource from file
     */
    private function createImageResource(string $path, string $mimeType)
    {
        switch ($mimeType) {
            case 'image/jpeg':
                return imagecreatefromjpeg($path);
            case 'image/png':
                return imagecreatefrompng($path);
            case 'image/gif':
                return imagecreatefromgif($path);
            case 'image/webp':
                return imagecreatefromwebp($path);
            default:
                return null;
        }
    }
    
    /**
     * Store original image without conversion
     */
    private function storeOriginal(UploadedFile $image, string $directory): string
    {
        $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
        return $image->storeAs($directory, $filename, 'public');
    }
    
    /**
     * Convert multiple images to WebP
     * 
     * @param array $images Array of UploadedFile
     * @param string $directory
     * @param int $maxImages Maximum number of images to process
     * @return array Array of paths
     */
    public function convertMultipleToWebP(
        array $images, 
        string $directory = 'products',
        int $maxImages = 10
    ): array {
        $paths = [];
        
        foreach ($images as $index => $image) {
            if ($index >= $maxImages) break;
            
            if ($image instanceof UploadedFile) {
                $path = $this->convertToWebP($image, $directory);
                if ($path) {
                    $paths[] = $path;
                }
            }
        }
        
        return $paths;
    }
}
