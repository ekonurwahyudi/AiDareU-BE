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
     * Generate professional product photo using Stability AI image-to-image
     */
    public function generateProductPhoto(Request $request): JsonResponse
    {
        Log::info('=== AI Product Photo Generation Request Started (Stability AI) ===');
        Log::info('Request data:', $request->except(['image']));

        try {
            $request->validate([
                'image' => 'required|image|max:10240', // max 10MB
                'lighting' => 'required|string|in:light,dark',
                'ambiance' => 'required|string|in:clean,crowd',
                'location' => 'nullable|string|in:indoor,outdoor',
                'aspect_ratio' => 'required|string|in:1:1,3:4,16:9,9:16',
                'additional_instructions' => 'nullable|string|max:500'
            ]);

            Log::info('Validation passed');

            // Get parameters
            $lighting = $request->input('lighting');
            $ambiance = $request->input('ambiance');
            $location = $request->input('location', 'indoor');
            $aspectRatio = $request->input('aspect_ratio');
            $additionalInstructions = $request->input('additional_instructions', '');

            // Get Stability AI API key
            $stabilityApiKey = env('STABILITY_API_KEY');
            if (!$stabilityApiKey || empty(trim($stabilityApiKey))) {
                Log::error('Stability AI API key not configured');
                throw new \Exception('Stability AI API key belum dikonfigurasi. Silakan hubungi administrator.');
            }

            // Step 1: Build the prompt for background transformation
            $prompt = $this->buildPrompt($lighting, $ambiance, $location, $additionalInstructions);
            Log::info('Generated prompt:', ['prompt' => $prompt]);

            // Step 2: Prepare the uploaded image
            $uploadedFile = $request->file('image');
            $imageContent = file_get_contents($uploadedFile->getRealPath());

            // Step 3: Generate 4 variations using Stability AI
            $photoResults = [];
            $errors = [];

            // Different strength values for variations
            $strengthValues = [0.35, 0.40, 0.45, 0.50];

            for ($i = 0; $i < 4; $i++) {
                try {
                    $strength = $strengthValues[$i];
                    Log::info("Generating variation " . ($i + 1) . " with strength: {$strength}");

                    // Call Stability AI image-to-image API
                    $response = Http::withHeaders([
                        'Authorization' => 'Bearer ' . $stabilityApiKey,
                        'Accept' => 'application/json',
                    ])
                    ->timeout(120)
                    ->asMultipart()
                    ->attach('init_image', $imageContent, 'image.png')
                    ->post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image', [
                        [
                            'name' => 'text_prompts[0][text]',
                            'contents' => $prompt
                        ],
                        [
                            'name' => 'text_prompts[0][weight]',
                            'contents' => '1'
                        ],
                        [
                            'name' => 'cfg_scale',
                            'contents' => '7'
                        ],
                        [
                            'name' => 'samples',
                            'contents' => '1'
                        ],
                        [
                            'name' => 'steps',
                            'contents' => '30'
                        ],
                        [
                            'name' => 'image_strength',
                            'contents' => (string)$strength
                        ],
                        [
                            'name' => 'style_preset',
                            'contents' => 'photographic'
                        ]
                    ]);

                    if ($response->successful()) {
                        $result = $response->json();

                        Log::info("Stability AI response successful for variation " . ($i + 1));

                        if (isset($result['artifacts']) && count($result['artifacts']) > 0) {
                            $base64Image = $result['artifacts'][0]['base64'];

                            // Decode and save the image
                            $imageData = base64_decode($base64Image);
                            $filename = 'product-photo-' . Str::uuid() . '.png';
                            $path = 'ai-product-photos/' . $filename;

                            Storage::disk('public')->put($path, $imageData);

                            // Get full URL (force HTTPS)
                            $savedImageUrl = str_replace('http://', 'https://', url('storage/' . $path));

                            Log::info("Image saved successfully", ['path' => $savedImageUrl]);

                            $photoResults[] = [
                                'id' => Str::uuid(),
                                'imageUrl' => $savedImageUrl,
                                'strength' => $strength
                            ];
                        }
                    } else {
                        $errorMsg = 'Stability AI error on variation ' . ($i + 1);
                        Log::error($errorMsg, [
                            'status' => $response->status(),
                            'body' => $response->body()
                        ]);
                        $errors[] = $errorMsg . ': ' . $response->body();
                    }

                    // Add delay between requests
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
                'message' => 'Product photos generated successfully',
                'data' => $photoResults,
                'errors' => $errors
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
     * Build prompt for Stability AI image-to-image
     */
    private function buildPrompt(string $lighting, string $ambiance, string $location, string $additionalInstructions): string
    {
        $lightingDescriptions = [
            'light' => 'bright natural daylight, soft shadows, well-lit, fresh atmosphere',
            'dark' => 'dramatic moody lighting, dark background, low-key lighting, cinematic'
        ];

        $ambianceDescriptions = [
            'clean' => 'clean minimalist studio background, simple elegant backdrop, professional product photography',
            'crowd' => 'lifestyle setting with natural props, contextual environment, real-world scene'
        ];

        $locationDescriptions = [
            'indoor' => 'indoor interior setting, cozy room',
            'outdoor' => 'outdoor natural environment, open air'
        ];

        $lightingDesc = $lightingDescriptions[$lighting] ?? 'bright natural daylight';
        $ambianceDesc = $ambianceDescriptions[$ambiance] ?? 'clean studio background';

        // Build prompt - focus on background/environment change
        $prompt = "Professional product photography, {$lightingDesc}, {$ambianceDesc}";

        // Add location if crowd
        if ($ambiance === 'crowd') {
            $locationDesc = $locationDescriptions[$location] ?? 'indoor setting';
            $prompt .= ", {$locationDesc}";
        }

        if (!empty($additionalInstructions)) {
            $prompt .= ", {$additionalInstructions}";
        }

        $prompt .= ", high-end commercial quality, sharp focus, beautiful composition, photo-realistic, 4K";

        return $prompt;
    }

    /**
     * Test endpoint to check if controller is working
     */
    public function testEndpoint(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'AI Product Photo Controller is working (Stability AI)',
            'php_version' => PHP_VERSION,
            'stability_configured' => !empty(env('STABILITY_API_KEY'))
        ]);
    }
}
