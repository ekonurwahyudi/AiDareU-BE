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
     * Generate logo using OpenAI DALL-E
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

            // Get OpenAI API key
            $apiKey = env('OPENAI_API_KEY');
            if (!$apiKey || empty(trim($apiKey))) {
                Log::error('OpenAI API key not configured');
                throw new \Exception('OpenAI API key belum dikonfigurasi. Silakan hubungi administrator.');
            }

            // Generate 4 logo variations
            $logoResults = [];
            $errors = [];

            for ($i = 0; $i < 4; $i++) {
                try {
                    // Add variation to prompt
                    $variationPrompt = $fullPrompt . " Variation " . ($i + 1) . ".";

                    Log::info("Generating logo variation " . ($i + 1), ['prompt' => $variationPrompt]);

                    // Call OpenAI DALL-E API
                    // Note: DALL-E 3 only supports square images, we'll process them after
                    $response = Http::withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                        'Content-Type' => 'application/json',
                    ])->timeout(60)->post('https://api.openai.com/v1/images/generations', [
                        'model' => 'dall-e-3',
                        'prompt' => $variationPrompt,
                        'n' => 1,
                        'size' => '1024x1024',
                        'quality' => 'standard',
                        'response_format' => 'url'
                    ]);

                    if ($response->successful()) {
                        $result = $response->json();
                        $imageUrl = $result['data'][0]['url'] ?? null;

                        Log::info("OpenAI response successful", ['has_url' => !is_null($imageUrl)]);

                        if ($imageUrl) {
                            try {
                                // Download the image
                                $imageContent = file_get_contents($imageUrl);

                                $filename = 'logo-' . Str::uuid() . '.png';
                                $path = 'ai-logos/' . $filename;

                                // Try to process image with transparency, fallback to original if fails
                                try {
                                    Log::info("Starting background removal process");
                                    $processedImage = $this->removeWhiteBackground($imageContent);
                                    Storage::disk('public')->put($path, $processedImage);
                                    Log::info("Background removed successfully");
                                } catch (\Exception $processingError) {
                                    Log::warning("Background removal failed, saving original: " . $processingError->getMessage());
                                    Storage::disk('public')->put($path, $imageContent);
                                }

                                // Get full URL for the saved image
                                $savedImageUrl = url('storage/' . $path);

                                Log::info("Image saved successfully", ['path' => $savedImageUrl]);

                                $logoResults[] = [
                                    'id' => Str::uuid(),
                                    'imageUrl' => $savedImageUrl,
                                    'prompt' => $variationPrompt
                                ];
                            } catch (\Exception $e) {
                                Log::error("Error downloading/saving image: " . $e->getMessage());
                                $errors[] = "Error saving image for variation " . ($i + 1) . ": " . $e->getMessage();
                            }
                        }
                    } else {
                        $errorMsg = 'OpenAI API error on variation ' . ($i + 1);
                        Log::error($errorMsg, [
                            'status' => $response->status(),
                            'body' => $response->body()
                        ]);
                        $errors[] = $errorMsg . ': ' . $response->body();
                    }

                    // Add small delay between requests
                    if ($i < 3) {
                        sleep(1);
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
     * Build enhanced prompt for logo generation
     */
    private function buildLogoPrompt(string $businessName, string $userPrompt, string $style): string
    {
        $styleDescriptions = [
            'modern' => 'modern and sleek with clean lines, contemporary',
            'simple' => 'simple and minimalistic, easy to recognize',
            'creative' => 'creative and unique with artistic elements',
            'minimalist' => 'minimalist design with essential elements only',
            'professional' => 'professional and corporate, business-appropriate',
            'playful' => 'playful and fun with vibrant elements',
            'elegant' => 'elegant and sophisticated, luxury feel',
            'bold' => 'bold and strong with impactful design'
        ];

        $styleDesc = $styleDescriptions[$style] ?? 'modern';

        return "Create a {$styleDesc} logo for '{$businessName}'. {$userPrompt}.

WHAT TO CREATE:
A simple flat 2D logo with icon + text. Just the logo mark itself on white background.

MUST INCLUDE:
• Icon/symbol element
• '{$businessName}' text with good typography
• Both combined in one clean design

WRONG (DO NOT CREATE THESE):
❌ Logo shown on a phone screen
❌ Logo on business cards or stationery
❌ Logo on coffee cups or products
❌ Logo with hands holding something
❌ Logo in mockup presentations
❌ Logo on bags, packaging, or boxes
❌ Any 3D scene or environment
❌ Any physical objects in the image

RIGHT (CREATE LIKE THESE):
✓ Just the Nike swoosh + NIKE text - nothing else
✓ Just the McDonald's arches + text - flat graphic only
✓ Just the Adidas trefoil + ADIDAS text - no context
✓ Just the Apple apple icon - the logo itself only

TECHNICAL SPECS:
• {$styleDesc} style
• Flat 2D vector design
• Icon and text combined
• White background (#FFFFFF)
• Centered, clean, professional
• NO shadows, NO depth, NO context
• The actual logo file - not a presentation of it

IMPORTANT: This is the LOGO FILE itself that will be used everywhere. Do NOT show it being used - just create the logo mark (icon + text) on white background. Nothing else in the image.

OUTPUT: Flat logo graphic only (icon + '{$businessName}' text on white).";
    }

    /**
     * Download logo file
     */
    public function downloadLogo(string $filename)
    {
        try {
            // Get origin from request for CORS
            $origin = request()->header('Origin', '*');

            // List of allowed origins
            $allowedOrigins = [
                'https://app.aidareu.com',
                'https://aidareu.com',
                'http://localhost:3000',
                'http://127.0.0.1:3000'
            ];

            // Check if origin is allowed
            $allowOrigin = in_array($origin, $allowedOrigins) ? $origin : '*';

            $path = 'ai-logos/' . $filename;

            // Check if file exists
            if (!Storage::disk('public')->exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Logo file not found'
                ], 404)
                ->header('Access-Control-Allow-Origin', $allowOrigin)
                ->header('Access-Control-Allow-Credentials', 'true');
            }

            // Get file contents
            $file = Storage::disk('public')->get($path);

            // Return file as download with CORS headers
            return response($file, 200)
                ->header('Content-Type', 'image/png')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Access-Control-Allow-Origin', $allowOrigin)
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept')
                ->header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type')
                ->header('Vary', 'Origin');

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
            'message' => 'AI Controller is working',
            'gd_available' => extension_loaded('gd'),
            'php_version' => PHP_VERSION,
            'memory_limit' => ini_get('memory_limit')
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
