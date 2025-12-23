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
     * Generate product photo dengan SDXL inpainting:
     * produk dipertahankan 100%, background diganti.
     */
    public function generateProductPhoto(Request $request): JsonResponse
    {
        Log::info('=== AI Product Photo Generation (Inpainting) Started ===');

        try {
            $request->validate([
                'image'                   => 'required|image|max:10240',  // foto produk
                'mask'                    => 'nullable|image|max:10240',  // optional user mask
                'lighting'                => 'required|string|in:light,dark',
                'ambiance'                => 'required|string|in:clean,crowd',
                'location'                => 'nullable|string|in:indoor,outdoor',
                'aspect_ratio'            => 'required|string|in:1:1,3:4,16:9,9:16',
                'additional_instructions' => 'nullable|string|max:500',
            ]);

            Log::info('Validation passed');

            $lighting   = $request->input('lighting');
            $ambiance   = $request->input('ambiance');
            $location   = $request->input('location', 'indoor');
            $aspectRatio= $request->input('aspect_ratio');
            $additional = $request->input('additional_instructions', '');

            // Get Stability AI API key
            $stabilityApiKey = env('STABILITY_API_KEY');
            if (!$stabilityApiKey || empty(trim($stabilityApiKey))) {
                Log::error('Stability AI API key not configured');
                throw new \Exception('Stability AI API key belum dikonfigurasi. Silakan hubungi administrator.');
            }

            // Step 1: Resize foto produk ke resolusi SDXL
            $uploadedFile = $request->file('image');
            $initImage    = $this->resizeImageForSDXL($uploadedFile->getRealPath(), $aspectRatio);
            Log::info('Product image resized for SDXL', ['aspect_ratio' => $aspectRatio]);

            // Step 2: Generate or use uploaded mask
            if ($request->hasFile('mask')) {
                // User uploaded custom mask
                $maskImage = $this->resizeImageForSDXL($request->file('mask')->getRealPath(), $aspectRatio);
                Log::info('Using user-uploaded mask');
            } else {
                // Auto-generate simple center mask (product in center is protected)
                $maskImage = $this->generateSimpleCenterMask($aspectRatio);
                Log::info('Generated automatic center mask');
            }

            // Step 3: Build background prompt
            $prompt = $this->buildBackgroundPrompt($lighting, $ambiance, $location, $additional);
            Log::info('Generated prompt', ['prompt' => $prompt]);

            // Step 4: Generate 4 variations using SDXL inpainting
            $photoResults = [];
            $errors       = [];

            for ($i = 0; $i < 4; $i++) {
                try {
                    Log::info('Generating inpainting variation ' . ($i + 1));

                    // Call Stability AI inpainting endpoint
                    $response = Http::withHeaders([
                            'Authorization' => 'Bearer ' . $stabilityApiKey,
                            'Accept'        => 'application/json',
                        ])
                        ->timeout(120)
                        ->asMultipart()
                        ->attach('init_image', $initImage, 'init.png')
                        ->attach('mask_image', $maskImage, 'mask.png')
                        ->post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image/masking', [
                            [
                                'name'     => 'text_prompts[0][text]',
                                'contents' => $prompt,
                            ],
                            [
                                'name'     => 'text_prompts[0][weight]',
                                'contents' => '1',
                            ],
                            [
                                'name'     => 'cfg_scale',
                                'contents' => '7', // background follows prompt well
                            ],
                            [
                                'name'     => 'samples',
                                'contents' => '1',
                            ],
                            [
                                'name'     => 'steps',
                                'contents' => '30',
                            ],
                            [
                                'name'     => 'mask_source',
                                'contents' => 'MASK_IMAGE_BLACK', // black areas are preserved
                            ],
                            [
                                'name'     => 'style_preset',
                                'contents' => 'photographic',
                            ],
                        ]);

                    if ($response->successful()) {
                        $result = $response->json();
                        Log::info('Stability AI inpainting response successful for variation ' . ($i + 1));

                        if (isset($result['artifacts']) && count($result['artifacts']) > 0) {
                            $base64Image = $result['artifacts'][0]['base64'];

                            // Decode & save
                            $imageData = base64_decode($base64Image);
                            $filename  = 'product-photo-' . Str::uuid() . '.png';
                            $path      = 'ai-product-photos/' . $filename;

                            Storage::disk('public')->put($path, $imageData);

                            // Force HTTPS URL
                            $savedImageUrl = str_replace('http://', 'https://', url('storage/' . $path));
                            Log::info('Image saved successfully', ['path' => $savedImageUrl]);

                            $photoResults[] = [
                                'id'       => (string) Str::uuid(),
                                'imageUrl' => $savedImageUrl,
                            ];
                        } else {
                            $errorMsg = 'Stability AI error on variation ' . ($i + 1) . ' (no artifacts)';
                            Log::error($errorMsg, [
                                'status' => $response->status(),
                                'body'   => $response->body(),
                            ]);
                            $errors[] = $errorMsg;
                        }
                    } else {
                        $errorMsg = 'Stability AI HTTP error on variation ' . ($i + 1);
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

            // Check if any photos were generated successfully
            if (empty($photoResults)) {
                $errorDetails = !empty($errors) ? ' Errors: ' . implode('; ', $errors) : '';
                throw new \Exception('Failed to generate any product photos. Please try again.' . $errorDetails);
            }

            return response()->json([
                'success' => true,
                'message' => 'Product photos generated successfully (inpainting)',
                'data'    => $photoResults,
                'errors'  => $errors,
            ]);
        } catch (\Exception $e) {
            Log::error('Product photo inpainting error:', [
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
     * Build prompt khusus untuk background (produk sudah dilindungi oleh mask).
     */
    private function buildBackgroundPrompt(
        string $lighting,
        string $ambiance,
        string $location,
        string $additionalInstructions
    ): string {
        $lightingDescriptions = [
            'light' => 'bright natural daylight, soft shadows, fresh atmosphere',
            'dark'  => 'dramatic moody lighting, dark background, cinematic look',
        ];

        $ambianceDescriptions = [
            'clean' => 'clean minimalist studio background, simple elegant backdrop, professional product photography',
            'crowd' => 'lifestyle setting with natural props, contextual environment, real-world scene',
        ];

        $locationDescriptions = [
            'indoor'  => 'indoor interior setting, cozy room',
            'outdoor' => 'outdoor natural environment, open air',
        ];

        $lightingDesc = $lightingDescriptions[$lighting] ?? 'bright natural daylight';
        $ambianceDesc = $ambianceDescriptions[$ambiance] ?? 'clean minimalist studio background';

        // Prompt fokus pada background saja, produk sudah dilindungi mask
        $prompt = "Create a new professional background and environment for product photography. "
                . "Do not alter the product in the masked area. "
                . "{$lightingDesc}, {$ambianceDesc}";

        if ($ambiance === 'crowd') {
            $locationDesc = $locationDescriptions[$location] ?? 'indoor interior setting';
            $prompt .= ", {$locationDesc}";
        }

        if (!empty($additionalInstructions)) {
            $prompt .= ", {$additionalInstructions}";
        }

        $prompt .= ", professional commercial photography, realistic, high resolution, 8K quality";

        return $prompt;
    }

    /**
     * Generate simple center mask:
     * - Black area (center) = product (preserved/protected)
     * - White area (edges) = background (will be repainted)
     */
    private function generateSimpleCenterMask(string $aspectRatio): string
    {
        $dimensionsMap = [
            '1:1'  => [1024, 1024],
            '3:4'  => [896, 1152],
            '16:9' => [1344, 768],
            '9:16' => [768, 1344],
        ];

        $dimensions = $dimensionsMap[$aspectRatio] ?? [1024, 1024];
        $width      = $dimensions[0];
        $height     = $dimensions[1];

        // Create mask canvas
        $mask = imagecreatetruecolor($width, $height);

        // White = background area (will be changed)
        $white = imagecolorallocate($mask, 255, 255, 255);
        imagefilledrectangle($mask, 0, 0, $width, $height, $white);

        // Black = product area (preserved)
        $black = imagecolorallocate($mask, 0, 0, 0);

        $centerX = (int) ($width / 2);
        $centerY = (int) ($height / 2);

        // Rectangle in center (50% width, 70% height) - adjust as needed
        // This assumes product is centered in the image
        $rectWidth  = (int) ($width * 0.50);
        $rectHeight = (int) ($height * 0.70);

        $x1 = $centerX - (int) ($rectWidth / 2);
        $y1 = $centerY - (int) ($rectHeight / 2);
        $x2 = $centerX + (int) ($rectWidth / 2);
        $y2 = $centerY + (int) ($rectHeight / 2);

        imagefilledrectangle($mask, $x1, $y1, $x2, $y2, $black);

        // Save to buffer
        ob_start();
        imagepng($mask, null, 9);
        $maskContent = ob_get_clean();

        imagedestroy($mask);

        return $maskContent;
    }

    /**
     * Resize image to SDXL-compatible dimensions based on aspect ratio.
     */
    private function resizeImageForSDXL(string $imagePath, string $aspectRatio): string
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

        // Create image from file
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

        // Create new canvas
        $resizedImage = imagecreatetruecolor($targetWidth, $targetHeight);

        // Handle transparency for PNG
        if ($mimeType === 'image/png') {
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);
            $transparent = imagecolorallocatealpha($resizedImage, 255, 255, 255, 127);
            imagefilledrectangle($resizedImage, 0, 0, $targetWidth, $targetHeight, $transparent);
        } else {
            // White background for JPG/WebP
            $white = imagecolorallocate($resizedImage, 255, 255, 255);
            imagefilledrectangle($resizedImage, 0, 0, $targetWidth, $targetHeight, $white);
        }

        // Get source dimensions
        $sourceWidth  = imagesx($sourceImage);
        $sourceHeight = imagesy($sourceImage);

        // Calculate scaling (cover mode - maintain aspect ratio)
        $sourceAspect = $sourceWidth / $sourceHeight;
        $targetAspect = $targetWidth / $targetHeight;

        if ($sourceAspect > $targetAspect) {
            // Source is wider - fit to height
            $scaledHeight = $targetHeight;
            $scaledWidth  = (int) ($targetHeight * $sourceAspect);
            $offsetX      = (int) (($targetWidth - $scaledWidth) / 2);
            $offsetY      = 0;
        } else {
            // Source is taller - fit to width
            $scaledWidth  = $targetWidth;
            $scaledHeight = (int) ($targetWidth / $sourceAspect);
            $offsetX      = 0;
            $offsetY      = (int) (($targetHeight - $scaledHeight) / 2);
        }

        // Resize and copy
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

        // Save to buffer
        ob_start();
        imagepng($resizedImage, null, 9);
        $imageContent = ob_get_clean();

        imagedestroy($sourceImage);
        imagedestroy($resizedImage);

        return $imageContent;
    }

    /**
     * Test endpoint to check if controller is working.
     */
    public function testEndpoint(): JsonResponse
    {
        return response()->json([
            'success'             => true,
            'message'             => 'AI Product Photo Controller (Inpainting) is working',
            'php_version'         => PHP_VERSION,
            'stability_configured'=> !empty(env('STABILITY_API_KEY')),
            'gd_enabled'          => extension_loaded('gd'),
        ]);
    }
}
