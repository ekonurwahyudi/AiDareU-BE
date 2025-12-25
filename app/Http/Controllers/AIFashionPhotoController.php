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
     */
    private function buildFashionPrompt(array $data): string
    {
        $modelType = $data['model_type'];
        $location = $data['location'];
        $visualStyle = $data['visual_style'];
        $additionalInstruction = $data['additional_instruction'] ?? '';

        // Model description
        $modelDesc = '';
        switch ($modelType) {
            case 'manusia':
                $gender = $data['gender'] ?? 'pria';
                $age = $data['age'] ?? 'dewasa';
                $genderText = $gender === 'pria' ? 'male' : 'female';
                $ageMap = [
                    'bayi' => 'baby',
                    'anak' => 'child',
                    'remaja' => 'teenager',
                    'dewasa' => 'adult',
                    'orang_tua' => 'middle-aged',
                    'kakek_nenek' => 'elderly'
                ];
                $ageText = $ageMap[$age] ?? 'adult';
                $modelDesc = "Professional fashion photo with {$ageText} {$genderText} model wearing the clothing";
                break;
            case 'manekin':
                $gender = $data['gender'] ?? 'pria';
                $genderText = $gender === 'pria' ? 'male' : 'female';
                $modelDesc = "Fashion photo with {$genderText} mannequin displaying the clothing";
                break;
            case 'tanpa_model':
                $modelDesc = "Flat lay fashion photo of the clothing, no model, product photography style";
                break;
            case 'custom':
                $modelDesc = "Fashion photo with the provided model wearing the clothing from the first image";
                break;
        }

        // Location
        $locationText = $location === 'indoor' ? 'indoor studio setting' : 'outdoor natural environment';

        // Visual style
        $styleMap = [
            'natural' => 'natural lighting, soft tones',
            'minimalis' => 'minimalist clean background, simple composition',
            'sunset' => 'golden hour sunset lighting, warm tones',
            'urban' => 'urban street style, city background',
            'elegan' => 'elegant sophisticated look, luxury feel'
        ];
        $styleText = $styleMap[$visualStyle] ?? $visualStyle;

        $prompt = "{$modelDesc}. {$locationText}. Style: {$styleText}. "
            . "High quality fashion photography, professional lighting, sharp details. ";

        if ($additionalInstruction) {
            $prompt .= "Additional: {$additionalInstruction}. ";
        }

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
