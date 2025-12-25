<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AIFashionPhotoController extends Controller
{
    /**
     * Generate fashion photo using fal.ai
     */
    public function generateFashionPhoto(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'clothing_image' => 'required|image|max:10240',
                'model_type' => 'required|string|in:manusia,manekin,tanpa_model,custom',
                'location' => 'required|string|in:indoor,outdoor',
                'visual_style' => 'required|string|max:200',
                'aspect_ratio' => 'required|string|in:1:1,3:4,9:16,16:9',
                'gender' => 'nullable|string|in:pria,wanita',
                'age' => 'nullable|string|in:bayi,anak,remaja,dewasa,orang_tua,kakek_nenek',
                'additional_instruction' => 'nullable|string|max:500',
                'custom_model_image' => 'nullable|image|max:10240',
            ]);

            Log::info('AI Fashion Photo: validation passed', $request->except(['clothing_image', 'custom_model_image']));

            $apiKey = env('FAL_API_KEY');
            if (!$apiKey || trim($apiKey) === '') {
                throw new \Exception('fal.ai API key belum dikonfigurasi.');
            }

            // Upload clothing image
            $clothingUrl = $this->uploadToTemporaryStorage($request->file('clothing_image'));
            Log::info('Clothing image uploaded', ['url' => $clothingUrl]);

            // Upload custom model image if provided
            $customModelUrl = null;
            if ($request->input('model_type') === 'custom' && $request->hasFile('custom_model_image')) {
                $customModelUrl = $this->uploadToTemporaryStorage($request->file('custom_model_image'));
                Log::info('Custom model image uploaded', ['url' => $customModelUrl]);
            }

            // Build prompt
            $prompt = $this->buildFashionPrompt($request->all());
            Log::info('Fashion prompt built', ['prompt' => $prompt]);

            $photoResults = [];
            $errors = [];

            // Generate 2 variations
            for ($i = 0; $i < 2; $i++) {
                try {
                    Log::info('Generating fashion variation ' . ($i + 1));

                    $imageUrls = [$clothingUrl];
                    if ($customModelUrl) {
                        $imageUrls[] = $customModelUrl;
                    }

                    $response = Http::withHeaders([
                        'Authorization' => 'Key ' . $apiKey,
                        'Content-Type' => 'application/json',
                    ])
                    ->timeout(180)
                    ->post('https://fal.run/fal-ai/nano-banana/edit', [
                        'prompt' => $prompt,
                        'image_urls' => $imageUrls,
                        'num_images' => 1,
                        'aspect_ratio' => $request->input('aspect_ratio'),
                        'output_format' => 'png',
                    ]);

                    if ($response->successful()) {
                        $result = $response->json();
                        Log::info('Fashion response for variation ' . ($i + 1), ['result' => $result]);

                        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
                            $generatedImageUrl = $result['images'][0]['url'];
                            $imageContent = file_get_contents($generatedImageUrl);
                            $filename = 'fashion-photo-' . Str::uuid() . '.png';
                            $path = 'ai-fashion-photos/' . $filename;

                            Storage::disk('public')->put($path, $imageContent);
                            $savedImageUrl = str_replace('http://', 'https://', url('storage/' . $path));

                            $photoResults[] = [
                                'id' => (string) Str::uuid(),
                                'imageUrl' => $savedImageUrl,
                                'filename' => $filename,
                                'prompt' => $prompt
                            ];
                        } else {
                            $errors[] = 'No image in response for variation ' . ($i + 1);
                        }
                    } else {
                        $errorMsg = 'fal.ai error on variation ' . ($i + 1);
                        Log::error($errorMsg, ['status' => $response->status(), 'body' => $response->body()]);
                        $errors[] = $errorMsg . ': ' . $response->body();
                    }

                    if ($i < 1) sleep(2);
                } catch (\Exception $e) {
                    Log::error('Error generating variation ' . ($i + 1), ['error' => $e->getMessage()]);
                    $errors[] = 'Error variation ' . ($i + 1) . ': ' . $e->getMessage();
                }
            }

            // Cleanup temp files
            $this->cleanupTempFile($clothingUrl);
            if ($customModelUrl) {
                $this->cleanupTempFile($customModelUrl);
            }

            if (empty($photoResults)) {
                throw new \Exception('Gagal generate foto. ' . implode('; ', $errors));
            }

            return response()->json([
                'success' => true,
                'message' => 'Fashion photos generated successfully',
                'data' => $photoResults,
                'errors' => $errors,
            ]);

        } catch (\Exception $e) {
            Log::error('Fashion photo error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Build prompt for fashion photo generation
     * Based on sulapfoto fashion photoshoot prompt structure
     */
    private function buildFashionPrompt(array $data): string
    {
        $modelType = $data['model_type'];
        $location = $data['location'];
        $visualStyle = $data['visual_style'];
        $additionalInstruction = $data['additional_instruction'] ?? '';

        // Location text
        $locationText = $location === 'indoor' ? 'indoor studio' : 'outdoor natural';

        // Visual style mapping
        $styleMap = [
            'natural' => 'Natural lighting with soft tones',
            'minimalis' => 'Studio Minimalis with clean background',
            'sunset' => 'Golden hour sunset lighting with warm tones',
            'urban' => 'Urban street style with city background',
            'elegan' => 'Elegant sophisticated luxury feel'
        ];
        $styleText = $styleMap[$visualStyle] ?? $visualStyle;

        $prompt = '';

        // Build prompt based on model type (following sulapfoto structure)
        if ($modelType === 'custom') {
            // Virtual try-on mode with custom model
            $prompt = "Perform a virtual try-on. You are given two primary images: an article of clothing and a person. "
                . "Your task is to realistically place the clothing onto the person. "
                . "CRITICAL INSTRUCTIONS: "
                . "1. The final image MUST feature the person from the second image, preserving their exact face, body, and pose. "
                . "2. The clothing from the first image must be transferred onto the person, fitting them naturally and realistically. "
                . "3. The background should be a {$locationText} setting with a '{$styleText}' visual style, suitable for a professional photoshoot.";
        } else {
            // Standard fashion photoshoot
            $prompt = "Create a professional fashion photoshoot. The main subject is the clothing from the provided image.";

            if ($modelType === 'manusia' || $modelType === 'manekin') {
                $gender = $data['gender'] ?? 'pria';
                $age = $data['age'] ?? 'dewasa';
                
                $genderText = $gender === 'pria' ? 'male' : 'female';
                $ageMap = [
                    'bayi' => 'baby',
                    'anak' => 'child',
                    'remaja' => 'teenager',
                    'dewasa' => 'adult',
                    'orang_tua' => 'middle-aged adult',
                    'kakek_nenek' => 'elderly'
                ];
                $ageText = $ageMap[$age] ?? 'adult';

                if ($modelType === 'manusia') {
                    $prompt .= " The clothing is worn by a photorealistic human model. The model is a {$genderText}, with an age appearance of '{$ageText}'.";
                } else {
                    $prompt .= " The clothing is displayed on a full-body, posable {$genderText} mannequin. The mannequin must be complete with a head (can be abstract or featureless), arms, and legs, and should be standing in a realistic, dynamic fashion model pose.";
                }
            } else {
                // tanpa_model - flat lay
                $prompt .= " The clothing is presented as a 'flat lay' or on a hanger against a clean background, with no model or mannequin visible.";
            }

            $prompt .= " The setting is a {$locationText} environment. The overall visual style and lighting should be '{$styleText}'.";
        }

        // Add additional instructions if provided
        if ($additionalInstruction) {
            $prompt .= " Additional user instructions: \"{$additionalInstruction}\".";
        }

        // Add variation and quality instructions
        $prompt .= " Create a slightly different pose or angle to provide variety. The final image must be high-resolution, sharp, and photorealistic.";

        return $prompt;
    }

    /**
     * Upload to temporary storage
     */
    private function uploadToTemporaryStorage($uploadedFile): string
    {
        $filename = 'temp-' . Str::uuid() . '.' . $uploadedFile->getClientOriginalExtension();
        $path = 'temp-uploads/' . $filename;
        Storage::disk('public')->put($path, file_get_contents($uploadedFile->getRealPath()));
        return str_replace('http://', 'https://', url('storage/' . $path));
    }

    /**
     * Cleanup temporary file
     */
    private function cleanupTempFile(string $url): void
    {
        try {
            $path = str_replace(url('storage/'), '', $url);
            $path = str_replace('https://api.aidareu.com/storage/', '', $path);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to cleanup temp file', ['url' => $url, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Download fashion photo
     */
    public function downloadFashionPhoto(string $filename)
    {
        try {
            $path = 'ai-fashion-photos/' . $filename;

            if (!Storage::disk('public')->exists($path)) {
                return response()->json(['success' => false, 'message' => 'File not found'], 404);
            }

            $file = Storage::disk('public')->get($path);
            $origin = request()->header('Origin', '*');

            return response($file, 200)
                ->header('Content-Type', 'image/png')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');

        } catch (\Exception $e) {
            Log::error('Download error:', ['filename' => $filename, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Test endpoint
     */
    public function testEndpoint(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'AI Fashion Photo Controller is working',
            'fal_configured' => !empty(env('FAL_API_KEY')),
        ]);
    }
}
