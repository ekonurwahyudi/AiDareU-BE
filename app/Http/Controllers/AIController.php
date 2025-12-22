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
        $request->validate([
            'business_name' => 'required|string|max:200',
            'prompt' => 'required|string|max:1000',
            'style' => 'required|string|in:modern,simple,creative,minimalist,professional,playful,elegant,bold',
            'image' => 'nullable|image|max:5120' // max 5MB
        ]);

        try {
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
                            // Download and save the image
                            $imageContent = file_get_contents($imageUrl);
                            $filename = 'logo-' . Str::uuid() . '.png';
                            $path = 'ai-logos/' . $filename;

                            Storage::disk('public')->put($path, $imageContent);

                            // Get full URL for the saved image
                            $savedImageUrl = url('storage/' . $path);

                            Log::info("Image saved successfully", ['path' => $savedImageUrl]);

                            $logoResults[] = [
                                'id' => Str::uuid(),
                                'imageUrl' => $savedImageUrl,
                                'prompt' => $variationPrompt
                            ];
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

        return "A {$styleDesc} logo design for '{$businessName}'. {$userPrompt}. IMPORTANT: Create ONLY the logo itself on a plain white background, NO mockups, NO business cards, NO packaging, NO product presentations. Just the clean logo mark that can be used anywhere. Vector-style, flat design, professional, simple, iconic, memorable. Centered on white background.";
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
