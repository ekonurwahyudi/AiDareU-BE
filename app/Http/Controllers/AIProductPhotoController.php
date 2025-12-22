<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AIProductPhotoController extends Controller
{
    /**
     * Generate professional product photo using OpenAI DALL-E
     */
    public function generateProductPhoto(Request $request): JsonResponse
    {
        Log::info('=== AI Product Photo Generation Request Started ===');
        Log::info('Request data:', $request->all());

        try {
            $request->validate([
                'image' => 'required|image|max:10240', // max 10MB
                'lighting' => 'required|string|in:light,dark',
                'ambiance' => 'required|string|in:clean,crowd',
                'aspect_ratio' => 'required|string|in:1:1,3:4,16:9,9:16',
                'additional_instructions' => 'nullable|string|max:500'
            ]);

            Log::info('Validation passed');

            // Get parameters
            $lighting = $request->input('lighting');
            $ambiance = $request->input('ambiance');
            $aspectRatio = $request->input('aspect_ratio');
            $additionalInstructions = $request->input('additional_instructions', '');

            // Map aspect ratio to DALL-E size
            $sizeMap = [
                '1:1' => '1024x1024',
                '3:4' => '1024x1792',  // Portrait
                '16:9' => '1792x1024', // Landscape
                '9:16' => '1024x1792'  // Portrait (same as 3:4 for DALL-E 3)
            ];
            $size = $sizeMap[$aspectRatio] ?? '1024x1024';

            // Build enhanced prompt
            $enhancedPrompt = $this->buildProductPhotoPrompt($lighting, $ambiance, $additionalInstructions);

            Log::info('Generating product photo with prompt:', ['prompt' => $enhancedPrompt]);

            // Get OpenAI API key
            $apiKey = env('OPENAI_API_KEY');
            if (!$apiKey || empty(trim($apiKey))) {
                Log::error('OpenAI API key not configured');
                throw new \Exception('OpenAI API key belum dikonfigurasi. Silakan hubungi administrator.');
            }

            // Note: DALL-E 3 doesn't support image editing directly
            // We'll use the image as context by describing it in the prompt
            // For actual image editing, we would need to use DALL-E 2 or other services

            // Generate 4 product photo variations
            $photoResults = [];
            $errors = [];

            for ($i = 0; $i < 4; $i++) {
                try {
                    // Add variation to prompt
                    $variationPrompt = $enhancedPrompt . " Variation " . ($i + 1) . ".";

                    Log::info("Generating photo variation " . ($i + 1), ['prompt' => $variationPrompt]);

                    // Call OpenAI DALL-E API
                    $response = Http::withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                        'Content-Type' => 'application/json',
                    ])->timeout(60)->post('https://api.openai.com/v1/images/generations', [
                        'model' => 'dall-e-3',
                        'prompt' => $variationPrompt,
                        'n' => 1,
                        'size' => $size,
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

                                $filename = 'product-photo-' . Str::uuid() . '.png';
                                $path = 'ai-product-photos/' . $filename;

                                // Save the image
                                Storage::disk('public')->put($path, $imageContent);

                                // Get full URL for the saved image (force HTTPS)
                                $savedImageUrl = str_replace('http://', 'https://', url('storage/' . $path));

                                Log::info("Image saved successfully", ['path' => $savedImageUrl]);

                                $photoResults[] = [
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

            if (empty($photoResults)) {
                $errorDetails = !empty($errors) ? ' Errors: ' . implode('; ', $errors) : '';
                throw new \Exception('Failed to generate any product photos. Please try again.' . $errorDetails);
            }

            return response()->json([
                'success' => true,
                'message' => 'Product photos generated successfully',
                'data' => $photoResults,
                'errors' => $errors // Include any partial errors
            ]);

        } catch (\Exception $e) {
            Log::error('Product photo generation error:', [
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
     * Build enhanced prompt for product photo generation
     */
    private function buildProductPhotoPrompt(string $lighting, string $ambiance, string $additionalInstructions): string
    {
        $lightingDescriptions = [
            'light' => 'bright, well-lit, natural daylight, soft shadows',
            'dark' => 'dramatic dark lighting, moody atmosphere, low-key lighting'
        ];

        $ambianceDescriptions = [
            'clean' => 'clean minimal background, studio setting, simple elegant backdrop',
            'crowd' => 'lifestyle setting, contextual environment, realistic scene with props'
        ];

        $lightingDesc = $lightingDescriptions[$lighting] ?? 'bright, well-lit';
        $ambianceDesc = $ambianceDescriptions[$ambiance] ?? 'clean minimal background';

        $basePrompt = "Professional product photography. {$lightingDesc}. {$ambianceDesc}. ";
        $basePrompt .= "High quality commercial photo, sharp focus on product, professional composition, ";
        $basePrompt .= "attractive presentation suitable for e-commerce or marketing. ";

        if (!empty($additionalInstructions)) {
            $basePrompt .= $additionalInstructions . " ";
        }

        $basePrompt .= "Photo-realistic, high resolution, professional studio quality.";

        return $basePrompt;
    }

    /**
     * Test endpoint to check if controller is working
     */
    public function testEndpoint(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'AI Product Photo Controller is working',
            'php_version' => PHP_VERSION,
            'openai_configured' => !empty(env('OPENAI_API_KEY'))
        ]);
    }
}
