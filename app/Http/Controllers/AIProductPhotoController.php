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
                'location' => 'nullable|string|in:indoor,outdoor', // only when ambiance is 'crowd'
                'aspect_ratio' => 'required|string|in:1:1,3:4,16:9,9:16',
                'additional_instructions' => 'nullable|string|max:500'
            ]);

            Log::info('Validation passed');

            // Get parameters
            $lighting = $request->input('lighting');
            $ambiance = $request->input('ambiance');
            $location = $request->input('location', 'indoor'); // default to indoor
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

            // Get OpenAI API key
            $apiKey = env('OPENAI_API_KEY');
            if (!$apiKey || empty(trim($apiKey))) {
                Log::error('OpenAI API key not configured');
                throw new \Exception('OpenAI API key belum dikonfigurasi. Silakan hubungi administrator.');
            }

            // Step 1: Analyze uploaded image with GPT-4 Vision to extract product details
            Log::info('Analyzing uploaded image with GPT-4 Vision');

            // Convert uploaded image to base64
            $imageData = base64_encode(file_get_contents($request->file('image')->getRealPath()));
            $imageBase64 = 'data:image/' . $request->file('image')->getClientOriginalExtension() . ';base64,' . $imageData;

            // Use GPT-4 Vision to analyze the product
            $visionResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(60)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o',
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => 'Describe this product in extreme detail for AI image generation. Include: EXACT product type, EXACT colors (hex if possible), EXACT shape and dimensions, EXACT brand name and text visible, EXACT logo details, material (plastic/glass/metal), cap/lid design. Be extremely specific so AI can recreate it identically. Max 150 words.'
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => $imageBase64
                                ]
                            ]
                        ]
                    ]
                ],
                'max_tokens' => 400
            ]);

            $productDescription = '';
            if ($visionResponse->successful()) {
                $visionResult = $visionResponse->json();
                $productDescription = $visionResult['choices'][0]['message']['content'] ?? '';
                Log::info('GPT-4 Vision analysis:', ['description' => $productDescription]);
            } else {
                Log::warning('GPT-4 Vision failed, using generic description', [
                    'status' => $visionResponse->status(),
                    'body' => $visionResponse->body()
                ]);
                $productDescription = 'A product bottle';
            }

            // Step 2: Build enhanced prompt using product description from Vision AI
            $enhancedPrompt = $this->buildProductPhotoPrompt($productDescription, $lighting, $ambiance, $location, $additionalInstructions);
            Log::info('Generated base prompt:', ['prompt' => $enhancedPrompt]);

            // Step 3: Generate 4 product photo variations using the analyzed description
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
    private function buildProductPhotoPrompt(string $productDescription, string $lighting, string $ambiance, string $location, string $additionalInstructions): string
    {
        $lightingDescriptions = [
            'light' => 'bright natural daylight, soft shadows, airy and fresh atmosphere',
            'dark' => 'dramatic moody lighting, dark elegant background, sophisticated ambiance'
        ];

        $ambianceDescriptions = [
            'clean' => 'minimalist clean studio background, simple elegant backdrop, focus on product only',
            'crowd' => 'lifestyle setting with natural props and contextual elements, real-world environment'
        ];

        $locationDescriptions = [
            'indoor' => 'indoor setting, cozy interior space',
            'outdoor' => 'outdoor natural environment, open air setting'
        ];

        $lightingDesc = $lightingDescriptions[$lighting] ?? 'bright natural daylight';
        $ambianceDesc = $ambianceDescriptions[$ambiance] ?? 'minimalist clean studio background';

        // Use product description from Vision AI as the base
        $basePrompt = "Professional product photography. ";
        $basePrompt .= "Product details (MUST BE EXACT): {$productDescription}. ";
        $basePrompt .= "Photography style: {$lightingDesc}, {$ambianceDesc}";

        // Add location description only if ambiance is 'crowd'
        if ($ambiance === 'crowd') {
            $locationDesc = $locationDescriptions[$location] ?? 'indoor setting';
            $basePrompt .= ", {$locationDesc}";
        }

        $basePrompt .= ". IMPORTANT: Recreate the EXACT product with EXACT colors, EXACT text, EXACT logo. ";
        $basePrompt .= "Only change the background/setting. Product must be identical to description. ";
        $basePrompt .= "High-end commercial photography, sharp focus on product, professional composition. ";

        if (!empty($additionalInstructions)) {
            $basePrompt .= "Scene styling: {$additionalInstructions}. ";
        }

        $basePrompt .= "Photo-realistic, 8K quality, product must match description perfectly.";

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
