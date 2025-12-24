<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AIController extends Controller
{
    /**
     * Generate logo using Stability AI SDXL 1.0 Text-to-Image
     */
    public function generateLogo(Request $request): JsonResponse
    {
        Log::info('=== AI Logo Generation Request Started ===');
        Log::info('Request method: ' . $request->method());
        Log::info('Request data:', $request->all());

        try {
            $request->validate([
                'business_name' => 'required|string|max:200',
                'prompt' => 'required|string|max:1000',
                'style' => 'required|string|in:modern,simple,creative,minimalist,professional,playful,elegant,bold',
                'image' => 'nullable|image|max:5120' // max 5MB
            ]);

            Log::info('Validation passed');

            $businessName = $request->input('business_name');
            $prompt = $request->input('prompt');
            $style = $request->input('style');

            // Build enhanced prompt with business name and style
            $enhancedPrompt = $this->buildLogoPrompt($businessName, $prompt, $style);

            // If image is provided, we'll use it as reference in the prompt
            $imageDescription = '';
            if ($request->hasFile('image')) {
                $imageDescription = ' Based on the uploaded sketch/reference image, ';
            }

            $fullPrompt = $enhancedPrompt . $imageDescription;

            Log::info('Generating logo with prompt:', ['prompt' => $fullPrompt]);

            // Get Stability AI API key
            $apiKey = env('STABILITY_API_KEY');
            if (!$apiKey || empty(trim($apiKey))) {
                Log::error('Stability AI API key not configured');
                throw new \Exception('Stability AI API key belum dikonfigurasi. Silakan hubungi administrator.');
            }

            // Generate 2 logo variations
            $logoResults = [];
            $errors = [];

            for ($i = 0; $i < 2; $i++) {
                try {
                    // Build better prompt for logo with text
                    $logoPrompt = $this->buildEnhancedLogoPrompt($businessName, $prompt, $style);
                    $logoPrompt .= " Variation " . ($i + 1) . ".";
                    
                    Log::info("Generating logo variation " . ($i + 1), ['prompt' => $logoPrompt]);

                    // Call Stability AI SDXL 1.0 Text-to-Image API
                    $response = Http::withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ])->timeout(90)->post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', [
                        'text_prompts' => [
                            [
                                'text' => $logoPrompt,
                                'weight' => 1
                            ],
                            [
                                'text' => 'blurry, low quality, distorted, watermark, signature, photo, realistic, 3d render, mockup, background objects',
                                'weight' => -1
                            ]
                        ],
                        'cfg_scale' => 8,
                        'height' => 1024,
                        'width' => 1024,
                        'samples' => 1,
                        'steps' => 40,
                        'style_preset' => 'digital-art',
                    ]);

                    if ($response->successful()) {
                        $result = $response->json();
                        
                        Log::info("Stability AI response successful for variation " . ($i + 1), ['result' => $result]);

                        if (isset($result['artifacts']) && is_array($result['artifacts']) && count($result['artifacts']) > 0) {
                            $imageBase64 = $result['artifacts'][0]['base64'] ?? null;
                            
                            if ($imageBase64) {
                                // Decode base64 image
                                $imageContent = base64_decode($imageBase64);

                                $filename = 'logo-' . Str::uuid() . '.png';
                                $path = 'ai-logos/' . $filename;

                                // Process image: remove white background and auto-crop
                                try {
                                    Log::info("Starting background removal and auto-crop process for variation " . ($i + 1));
                                    $processedImage = $this->removeWhiteBackground($imageContent);
                                    Storage::disk('public')->put($path, $processedImage);
                                    Log::info("Background removed and cropped successfully for variation " . ($i + 1));
                                } catch (\Exception $processingError) {
                                    Log::warning("Background removal failed for variation " . ($i + 1) . ", saving original: " . $processingError->getMessage());
                                    Storage::disk('public')->put($path, $imageContent);
                                }

                                // Get full URL for the saved image (force HTTPS for production)
                                $savedImageUrl = str_replace('http://', 'https://', url('storage/' . $path));

                                Log::info("Image saved successfully for variation " . ($i + 1), ['path' => $savedImageUrl]);

                                $logoResults[] = [
                                    'id' => Str::uuid(),
                                    'imageUrl' => $savedImageUrl,
                                    'filename' => $filename,
                                    'prompt' => $logoPrompt
                                ];
                            }
                        } else {
                            Log::error("No artifacts in Stability AI response for variation " . ($i + 1), ['response' => $result]);
                            $errors[] = "No image generated for variation " . ($i + 1);
                        }
                    } else {
                        $errorMsg = 'Stability AI API error on variation ' . ($i + 1);
                        Log::error($errorMsg, [
                            'status' => $response->status(),
                            'body' => $response->body()
                        ]);
                        $errors[] = $errorMsg . ': ' . $response->body();
                    }

                    // Add small delay between requests
                    if ($i < 1) {
                        sleep(2);
                    }
                } catch (\Exception $e) {
                    $errorMsg = 'Error generating variation ' . ($i + 1);
                    Log::error($errorMsg, ['error' => $e->getMessage()]);
                    $errors[] = $errorMsg . ': ' . $e->getMessage();
                }
            }

            if (empty($logoResults)) {
                $errorDetails = !empty($errors) ? ' Errors: ' . implode('; ', $errors) : '';
                throw new \Exception('Failed to generate any logos. Please try again.' . $errorDetails);
            }

            return response()->json([
                'success' => true,
                'message' => 'Logos generated successfully',
                'data' => $logoResults,
                'errors' => $errors // Include any partial errors
            ]);

        } catch (\Exception $e) {
            Log::error('Logo generation error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove white background and make it transparent
     */
    private function removeWhiteBackground(string $imageContent): string
    {
        // Check if GD extension is loaded
        if (!extension_loaded('gd')) {
            Log::warning('GD extension not available, returning original image');
            return $imageContent;
        }

        try {
            // Increase memory limit for image processing
            $oldMemoryLimit = ini_get('memory_limit');
            ini_set('memory_limit', '512M');

            // Create image from string
            $image = @imagecreatefromstring($imageContent);
            if (!$image) {
                Log::warning('Failed to create image from string, returning original');
                ini_set('memory_limit', $oldMemoryLimit);
                return $imageContent; // Return original if processing fails
            }
        } catch (\Throwable $e) {
            Log::error('Error in removeWhiteBackground: ' . $e->getMessage());
            return $imageContent;
        }

        // Get image dimensions
        $width = imagesx($image);
        $height = imagesy($image);

        // Create new image with alpha channel
        $transparent = imagecreatetruecolor($width, $height);

        // Enable alpha blending and save alpha channel
        imagealphablending($transparent, false);
        imagesavealpha($transparent, true);

        // Fill with transparent color
        $transparentColor = imagecolorallocatealpha($transparent, 0, 0, 0, 127);
        imagefill($transparent, 0, 0, $transparentColor);

        // Define white color range for removal (adjust tolerance as needed)
        $tolerance = 30; // Adjust this value (0-127) for more/less aggressive removal

        // Process each pixel
        for ($x = 0; $x < $width; $x++) {
            for ($y = 0; $y < $height; $y++) {
                $rgb = imagecolorat($image, $x, $y);
                $colors = imagecolorsforindex($image, $rgb);

                // Check if pixel is white (or close to white)
                if ($colors['red'] >= (255 - $tolerance) &&
                    $colors['green'] >= (255 - $tolerance) &&
                    $colors['blue'] >= (255 - $tolerance)) {
                    // Make it transparent
                    $newColor = imagecolorallocatealpha($transparent,
                        $colors['red'],
                        $colors['green'],
                        $colors['blue'],
                        127
                    );
                } else {
                    // Keep original color
                    $newColor = imagecolorallocatealpha($transparent,
                        $colors['red'],
                        $colors['green'],
                        $colors['blue'],
                        $colors['alpha']
                    );
                }
                imagesetpixel($transparent, $x, $y, $newColor);
            }
        }

        // Auto-crop to remove excess transparent space and optimize size
        $transparent = $this->autoCropImage($transparent);

        // Save to buffer
        ob_start();
        imagepng($transparent, null, 9); // 9 = maximum compression
        $processedContent = ob_get_contents();
        ob_end_clean();

        // Clean up
        imagedestroy($image);
        imagedestroy($transparent);

        // Restore memory limit
        ini_set('memory_limit', $oldMemoryLimit);

        Log::info('Image processed successfully with transparent background');

        return $processedContent;
    }

    /**
     * Auto-crop image to remove excess transparent space
     */
    private function autoCropImage($image)
    {
        $width = imagesx($image);
        $height = imagesy($image);

        // Find boundaries
        $top = $height;
        $bottom = 0;
        $left = $width;
        $right = 0;

        for ($x = 0; $x < $width; $x++) {
            for ($y = 0; $y < $height; $y++) {
                $rgb = imagecolorat($image, $x, $y);
                $colors = imagecolorsforindex($image, $rgb);

                // Check if pixel is not transparent
                if ($colors['alpha'] < 127) {
                    if ($x < $left) $left = $x;
                    if ($x > $right) $right = $x;
                    if ($y < $top) $top = $y;
                    if ($y > $bottom) $bottom = $y;
                }
            }
        }

        // Add small padding (5% of dimensions)
        $padding = 20;
        $left = max(0, $left - $padding);
        $top = max(0, $top - $padding);
        $right = min($width - 1, $right + $padding);
        $bottom = min($height - 1, $bottom + $padding);

        // Calculate new dimensions
        $newWidth = $right - $left + 1;
        $newHeight = $bottom - $top + 1;

        // Don't crop if no content found
        if ($newWidth <= 0 || $newHeight <= 0) {
            return $image;
        }

        // Create cropped image
        $cropped = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($cropped, false);
        imagesavealpha($cropped, true);

        // Fill with transparent
        $transparentColor = imagecolorallocatealpha($cropped, 0, 0, 0, 127);
        imagefill($cropped, 0, 0, $transparentColor);

        // Copy cropped portion
        imagecopy($cropped, $image, 0, 0, $left, $top, $newWidth, $newHeight);

        imagedestroy($image);

        return $cropped;
    }

    /**
     * Build enhanced prompt for better logo generation with text
     */
    private function buildEnhancedLogoPrompt(string $businessName, string $userPrompt, string $style): string
    {
        $styleDescriptions = [
            'modern'      => 'modern, clean, minimalist',
            'simple'      => 'simple, minimal, clean lines',
            'creative'    => 'creative, unique, artistic',
            'minimalist'  => 'minimalist, simple shapes, clean',
            'professional'=> 'professional, corporate, elegant',
            'playful'     => 'playful, fun, friendly',
            'elegant'     => 'elegant, sophisticated, refined',
            'bold'        => 'bold, strong, impactful',
        ];

        $styleDesc = $styleDescriptions[$style] ?? 'modern, clean, minimalist';

        // Enhanced prompt for Stability AI
        return "Professional logo design, {$styleDesc} style. "
            . "Logo text: '{$businessName}'. "
            . "Concept: {$userPrompt}. "
            . "Flat vector style, simple icon with text, clean typography, "
            . "white background, centered composition, high contrast, "
            . "professional branding, corporate identity, "
            . "no mockups, no 3D, no photos, pure logo design";
    }

    /**
     * Build enhanced prompt for logo generation (legacy - kept for compatibility)
     */
    private function buildLogoPrompt(string $businessName, string $userPrompt, string $style): string
    {
        $styleDescriptions = [
            'modern'      => 'modern, clean, flat style',
            'simple'      => 'simple and minimalistic',
            'creative'    => 'creative and unique',
            'minimalist'  => 'minimalist with simple shapes',
            'professional'=> 'professional corporate style',
            'playful'     => 'playful with friendly shapes',
            'elegant'     => 'elegant with refined lines',
            'bold'        => 'bold and impactful',
        ];

        $styleDesc = $styleDescriptions[$style] ?? 'modern, clean, flat style';

        // Prompt pendek khusus untuk DALL·E
        return "Flat 2D {$styleDesc} logo for a business named '{$businessName}'. "
            ."Use a single, simple icon representing the business on the left and the text '{$businessName}' on the right, "
            ."or the icon on top and the text '{$businessName}' at the bottom. "
            ."Clean sans-serif typography, no mockups, no additional objects, no decorations, "
            ."plain white background, centered, vector-style, high contrast. "
            ."Business concept: {$userPrompt}.";
    }

    /**
     * Download logo file via proxy to avoid CORS
     */
    public function downloadLogo(string $filename)
    {
        try {
            $path = 'ai-logos/' . $filename;

            // Check if file exists
            if (!Storage::disk('public')->exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Logo file not found'
                ], 404);
            }

            // Get file contents
            $file = Storage::disk('public')->get($path);

            // Return file as download with proper headers
            return response($file, 200)
                ->header('Content-Type', 'image/png')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

        } catch (\Exception $e) {
            Log::error('Logo download error:', [
                'filename' => $filename,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to download logo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test endpoint to check if controller is working
     */
    public function testEndpoint(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'AI Controller is working (Stability AI)',
            'gd_available' => extension_loaded('gd'),
            'php_version' => PHP_VERSION,
            'memory_limit' => ini_get('memory_limit'),
            'stability_configured' => !empty(env('STABILITY_API_KEY'))
        ]);
    }

    /**
     * Refine/edit existing logo
     */
    public function refineLogo(Request $request): JsonResponse
    {
        $request->validate([
            'original_prompt' => 'required|string',
            'refinement_instructions' => 'required|string|max:500',
            'style' => 'required|string'
        ]);

        // Reuse the generateLogo method with refined prompt
        $request->merge([
            'prompt' => $request->original_prompt . ' ' . $request->refinement_instructions
        ]);

        return $this->generateLogo($request);
    }
}
