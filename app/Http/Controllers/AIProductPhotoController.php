<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AIProductPhotoController extends Controller
{
    /**
     * Generate foto produk:
     * produk asli dipertahankan, background + pencahayaan diganti.
     */
    public function generateProductPhoto(Request $request): JsonResponse
    {
        try {
            // 1. Validasi input dari frontend
            $request->validate([
                'image'                  => 'required|image|max:10240',
                'lighting'               => 'required|string|in:light,dark',
                'ambiance'               => 'required|string|in:clean,crowd',
                'location'               => 'nullable|string|in:indoor,outdoor',
                'aspect_ratio'           => 'required|string|in:1:1,3:4,16:9,9:16',
                'additional_instructions'=> 'nullable|string|max:500',
            ]);

            Log::info('AI Product Photo (fal.ai nano-banana): validation passed');

            $lighting     = $request->input('lighting');
            $ambiance     = $request->input('ambiance');
            $location     = $request->input('location', 'indoor');
            $aspectRatio  = $request->input('aspect_ratio');
            $additional   = $request->input('additional_instructions', '');

            // 2. API key fal.ai
            $apiKey = env('FAL_API_KEY');
            if (!$apiKey || trim($apiKey) === '') {
                Log::error('fal.ai API key not configured');
                throw new \Exception('fal.ai API key belum dikonfigurasi. Silakan hubungi administrator.');
            }

            // 3. Upload gambar ke temporary public URL
            $uploadedFile = $request->file('image');
            $imageUrl = $this->uploadToTemporaryStorage($uploadedFile);
            Log::info('Image uploaded to temporary storage', ['url' => $imageUrl]);

            // 4. Bangun prompt untuk nano-banana (background replacement dengan lighting)
            $prompt = $this->buildNanoBananaPrompt(
                $lighting,
                $ambiance,
                $location,
                $additional
            );
            Log::info('Generated nano-banana prompt', ['prompt' => $prompt]);

            // 5. Convert aspect ratio ke format fal.ai
            $aspectRatioMap = [
                '1:1'  => '1:1',
                '3:4'  => '3:4',
                '16:9' => '16:9',
                '9:16' => '9:16',
            ];
            $falAspectRatio = $aspectRatioMap[$aspectRatio] ?? '1:1';

            $photoResults = [];
            $errors       = [];

            // 6. Generate 4 variasi menggunakan nano-banana edit
            for ($i = 0; $i < 4; $i++) {
                try {
                    Log::info('Generating variation (nano-banana) ' . ($i + 1));

                    // Call fal.ai nano-banana edit endpoint
                    $response = Http::withHeaders([
                            'Authorization' => 'Key ' . $apiKey,
                            'Content-Type'  => 'application/json',
                        ])
                        ->timeout(120)
                        ->post('https://fal.run/fal-ai/nano-banana/edit', [
                            'prompt'        => $prompt,
                            'image_urls'    => [$imageUrl],
                            'num_images'    => 1,
                            'aspect_ratio'  => $falAspectRatio,
                            'output_format' => 'png',
                        ]);

                    if ($response->successful()) {
                        $result = $response->json();
                        Log::info('fal.ai response successful for variation ' . ($i + 1), ['result' => $result]);

                        // nano-banana mengembalikan array images dengan url
                        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
                            $generatedImageUrl = $result['images'][0]['url'];

                            // Download image dari fal.ai dan simpan ke storage
                            $imageContent = file_get_contents($generatedImageUrl);
                            $filename     = 'product-photo-' . Str::uuid() . '.png';
                            $path         = 'ai-product-photos/' . $filename;

                            // Save original image
                            Storage::disk('public')->put($path, $imageContent);

                            // Create compressed version for display
                            $compressedFilename = 'compressed-' . $filename;
                            $compressedPath = 'ai-product-photos/' . $compressedFilename;
                            $compressedContent = $this->compressImage($imageContent);
                            Storage::disk('public')->put($compressedPath, $compressedContent);

                            // URLs for display (compressed) and download (original)
                            $displayUrl = str_replace('http://', 'https://', url('storage/' . $compressedPath));
                            $downloadUrl = str_replace('http://', 'https://', url('storage/' . $path));

                            Log::info('Product photo URLs generated', [
                                'display' => $displayUrl,
                                'download' => $downloadUrl,
                                'filename' => $filename
                            ]);

                            $photoResults[] = [
                                'id' => (string) Str::uuid(),
                                'imageUrl' => $displayUrl, // Compressed untuk tampilan cepat
                                'downloadUrl' => $downloadUrl, // Original untuk download
                                'filename' => $filename,
                                'prompt' => $prompt
                            ];
                        } else {
                            $errorMsg = 'fal.ai error on variation ' . ($i + 1) . ' (no images in response)';
                            Log::error($errorMsg, ['response' => $result]);
                            $errors[] = $errorMsg;
                        }
                    } else {
                        $errorMsg = 'fal.ai HTTP error on variation ' . ($i + 1);
                        Log::error($errorMsg, [
                            'status' => $response->status(),
                            'body'   => $response->body(),
                        ]);
                        $errors[] = $errorMsg . ': ' . $response->body();
                    }

                    // Small delay between requests
                    if ($i < 3) {
                        sleep(2);
                    }
                } catch (\Exception $e) {
                    $errorMsg = 'Error generating variation ' . ($i + 1);
                    Log::error($errorMsg, ['error' => $e->getMessage()]);
                    $errors[] = $errorMsg . ': ' . $e->getMessage();
                }
            }

            if (empty($photoResults)) {
                $errorDetails = !empty($errors) ? ' Errors: ' . implode('; ', $errors) : '';
                throw new \Exception('Failed to generate any product photos. Please try again.' . $errorDetails);
            }

            return response()->json([
                'success' => true,
                'message' => 'Product photos generated successfully (fal.ai nano-banana)',
                'data'    => $photoResults,
                'errors'  => $errors,
            ]);
        } catch (\Exception $e) {
            Log::error('Product photo generation error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload image ke temporary storage dan return public URL.
     */
    private function uploadToTemporaryStorage($uploadedFile): string
    {
        // Simpan file ke storage public temporary
        $filename = 'temp-' . Str::uuid() . '.' . $uploadedFile->getClientOriginalExtension();
        $path     = 'temp-uploads/' . $filename;

        Storage::disk('public')->put($path, file_get_contents($uploadedFile->getRealPath()));

        // Return full public URL
        return str_replace('http://', 'https://', url('storage/' . $path));
    }

    /**
     * Bangun prompt untuk nano-banana edit (background replacement + lighting).
     */
    private function buildNanoBananaPrompt(
        string $lighting,
        string $ambiance,
        string $location,
        string $additional
    ): string {
        $lightingMap = [
            'light' => 'bright natural daylight, soft shadows, fresh atmosphere',
            'dark'  => 'dramatic moody lighting, dark background, cinematic look',
        ];

        $ambianceMap = [
            'clean' => 'replace background with clean minimalist studio setting, simple elegant backdrop, professional product photography',
            'crowd' => 'replace background with lifestyle setting, natural props, contextual environment, real-world scene',
        ];

        $locationMap = [
            'indoor'  => 'indoor interior setting, cozy modern room',
            'outdoor' => 'outdoor natural environment, garden or urban setting',
        ];

        $lightingDesc = $lightingMap[$lighting] ?? $lightingMap['light'];
        $ambianceDesc = $ambianceMap[$ambiance] ?? $ambianceMap['clean'];

        // Prompt khusus untuk nano-banana: instruksi background replacement
        $prompt = "Replace the background of this product photo. Keep the product exactly as is, sharp and clear in focus. "
            . "{$ambianceDesc}, {$lightingDesc}";

        if ($ambiance === 'crowd') {
            $locationDesc = $locationMap[$location] ?? $locationMap['indoor'];
            $prompt      .= ", {$locationDesc}";
        }

        if (!empty($additional)) {
            $prompt .= ", {$additional}";
        }

        $prompt .= ", professional commercial product photography, high resolution, photorealistic, depth of field";

        return $prompt;
    }

    /**
     * Resize image ke dimensi optimal untuk nano-banana (optional, tapi bisa membantu).
     */
    private function resizeImageForNanoBanana(string $imagePath, string $aspectRatio): string
    {
        $dimensionsMap = [
            '1:1'  => [1024, 1024],
            '3:4'  => [896, 1152],
            '16:9' => [1344, 768],
            '9:16' => [768, 1344],
        ];

        $dimensions   = $dimensionsMap[$aspectRatio] ?? [1024, 1024];
        $targetWidth  = $dimensions[0];
        $targetHeight = $dimensions[1];

        $imageInfo = getimagesize($imagePath);
        $mimeType  = $imageInfo['mime'] ?? null;

        switch ($mimeType) {
            case 'image/jpeg':
                $sourceImage = imagecreatefromjpeg($imagePath);
                break;
            case 'image/png':
                $sourceImage = imagecreatefrompng($imagePath);
                break;
            case 'image/webp':
                $sourceImage = imagecreatefromwebp($imagePath);
                break;
            default:
                throw new \Exception('Unsupported image format. Please use JPG, PNG, or WEBP.');
        }

        $resizedImage = imagecreatetruecolor($targetWidth, $targetHeight);

        if ($mimeType === 'image/png') {
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);
            $transparent = imagecolorallocatealpha($resizedImage, 255, 255, 255, 127);
            imagefilledrectangle($resizedImage, 0, 0, $targetWidth, $targetHeight, $transparent);
        } else {
            $white = imagecolorallocate($resizedImage, 255, 255, 255);
            imagefilledrectangle($resizedImage, 0, 0, $targetWidth, $targetHeight, $white);
        }

        $sourceWidth  = imagesx($sourceImage);
        $sourceHeight = imagesy($sourceImage);

        $sourceAspect = $sourceWidth / $sourceHeight;
        $targetAspect = $targetWidth / $targetHeight;

        if ($sourceAspect > $targetAspect) {
            $scaledHeight = $targetHeight;
            $scaledWidth  = (int) ($targetHeight * $sourceAspect);
            $offsetX      = (int) (($targetWidth - $scaledWidth) / 2);
            $offsetY      = 0;
        } else {
            $scaledWidth  = $targetWidth;
            $scaledHeight = (int) ($targetWidth / $sourceAspect);
            $offsetX      = 0;
            $offsetY      = (int) (($targetHeight - $scaledHeight) / 2);
        }

        imagecopyresampled(
            $resizedImage,
            $sourceImage,
            $offsetX,
            $offsetY,
            0,
            0,
            $scaledWidth,
            $scaledHeight,
            $sourceWidth,
            $sourceHeight
        );

        ob_start();
        imagepng($resizedImage, null, 9);
        $imageContent = ob_get_clean();

        imagedestroy($sourceImage);
        imagedestroy($resizedImage);

        return $imageContent;
    }

    /**
     * Compress image for faster loading while maintaining quality
     */
    private function compressImage(string $imageContent): string
    {
        // Check if GD extension is loaded
        if (!extension_loaded('gd')) {
            Log::warning('GD extension not available, returning original image');
            return $imageContent;
        }

        try {
            // Create image from string
            $image = @imagecreatefromstring($imageContent);
            if (!$image) {
                Log::warning('Failed to create image from string, returning original');
                return $imageContent;
            }

            $width = imagesx($image);
            $height = imagesy($image);

            // Calculate new dimensions (max 800px on longest side for display)
            $maxSize = 800;
            if ($width > $height) {
                if ($width > $maxSize) {
                    $newWidth = $maxSize;
                    $newHeight = intval(($height * $maxSize) / $width);
                } else {
                    $newWidth = $width;
                    $newHeight = $height;
                }
            } else {
                if ($height > $maxSize) {
                    $newHeight = $maxSize;
                    $newWidth = intval(($width * $maxSize) / $height);
                } else {
                    $newWidth = $width;
                    $newHeight = $height;
                }
            }

            // Create new image with calculated dimensions
            $compressedImage = imagecreatetruecolor($newWidth, $newHeight);

            // Preserve transparency for PNG
            imagealphablending($compressedImage, false);
            imagesavealpha($compressedImage, true);
            $transparent = imagecolorallocatealpha($compressedImage, 0, 0, 0, 127);
            imagefill($compressedImage, 0, 0, $transparent);

            // Resize image
            imagecopyresampled(
                $compressedImage,
                $image,
                0, 0, 0, 0,
                $newWidth, $newHeight,
                $width, $height
            );

            // Save to buffer with compression
            ob_start();
            imagepng($compressedImage, null, 6); // Compression level 6 (good balance)
            $compressedContent = ob_get_contents();
            ob_end_clean();

            // Clean up
            imagedestroy($image);
            imagedestroy($compressedImage);

            Log::info('Image compressed successfully', [
                'original_size' => strlen($imageContent),
                'compressed_size' => strlen($compressedContent),
                'compression_ratio' => round((1 - strlen($compressedContent) / strlen($imageContent)) * 100, 2) . '%'
            ]);

            return $compressedContent;

        } catch (\Exception $e) {
            Log::error('Error compressing image: ' . $e->getMessage());
            return $imageContent; // Return original if compression fails
        }
    }

    /**
     * Endpoint test.
     */
    public function testEndpoint(): JsonResponse
    {
        return response()->json([
            'success'          => true,
            'message'          => 'AI Product Photo Controller (fal.ai nano-banana) is working',
            'php_version'      => PHP_VERSION,
            'fal_configured'   => !empty(env('FAL_API_KEY')),
            'gd_enabled'       => extension_loaded('gd'),
        ]);
    }
}
