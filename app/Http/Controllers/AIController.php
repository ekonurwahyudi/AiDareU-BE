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
            'prompt' => 'required|string|max:1000',
            'style' => 'required|string|in:modern,simple,creative,minimalist,professional,playful,elegant,bold',
            'image' => 'nullable|image|max:5120' // max 5MB
        ]);

        try {
            $prompt = $request->input('prompt');
            $style = $request->input('style');

            // Build enhanced prompt with style
            $enhancedPrompt = $this->buildLogoPrompt($prompt, $style);

            // If image is provided, we'll use it as reference in the prompt
            $imageDescription = '';
            if ($request->hasFile('image')) {
                $imageDescription = ' Based on the uploaded sketch/reference image, ';
            }

            $fullPrompt = $enhancedPrompt . $imageDescription;

            Log::info('Generating logo with prompt:', ['prompt' => $fullPrompt]);

            // Get OpenAI API key
            $apiKey = env('OPENAI_API_KEY');
            if (!$apiKey) {
                throw new \Exception('OpenAI API key not configured');
            }

            // Generate 4 logo variations
            $logoResults = [];

            for ($i = 0; $i < 4; $i++) {
                // Add variation to prompt
                $variationPrompt = $fullPrompt . " Variation $i.";

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

                    if ($imageUrl) {
                        // Download and save the image
                        $imageContent = file_get_contents($imageUrl);
                        $filename = 'logo-' . Str::uuid() . '.png';
                        $path = 'ai-logos/' . $filename;

                        Storage::disk('public')->put($path, $imageContent);

                        $logoResults[] = [
                            'id' => Str::uuid(),
                            'imageUrl' => Storage::disk('public')->url($path),
                            'prompt' => $variationPrompt
                        ];
                    }
                } else {
                    Log::error('OpenAI API error:', [
                        'status' => $response->status(),
                        'body' => $response->body()
                    ]);
                }

                // Add small delay between requests
                if ($i < 3) {
                    sleep(1);
                }
            }

            if (empty($logoResults)) {
                throw new \Exception('Failed to generate any logos. Please try again.');
            }

            return response()->json([
                'success' => true,
                'message' => 'Logos generated successfully',
                'data' => $logoResults
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
    private function buildLogoPrompt(string $userPrompt, string $style): string
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

        return "Create a {$styleDesc} logo design. {$userPrompt}. The logo should be: professional, suitable for brand identity, vector-style, clean background, high quality, iconic, memorable, scalable design.";
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
