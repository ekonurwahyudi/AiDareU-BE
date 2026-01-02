<?php

namespace App\Http\Controllers;

use App\Models\AiGenerationHistory;
use App\Models\CoinTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AIFashionPhotoController extends Controller
{
    /**
     * Generate fashion photo using fal.ai flux-2-lora-gallery/virtual-tryon
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

            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Check coin balance BEFORE generating
            $coinSummary = CoinTransaction::forUser($user->uuid)
                ->select(
                    DB::raw('SUM(coin_masuk) as total_coin_masuk'),
                    DB::raw('SUM(coin_keluar) as total_coin_keluar')
                )
                ->first();

            $totalCoinMasuk = $coinSummary->total_coin_masuk ?? 0;
            $totalCoinKeluar = $coinSummary->total_coin_keluar ?? 0;
            $coinSaatIni = $totalCoinMasuk - $totalCoinKeluar;

            $requiredCoin = 2; // 2 variations x 1 coin each

            if ($coinSaatIni < $requiredCoin) {
                return response()->json([
                    'success' => false,
                    'message' => "Coin tidak cukup! Anda memiliki {$coinSaatIni} Pts, membutuhkan {$requiredCoin} Pts untuk generate 2 foto fashion.",
                    'current_coin' => $coinSaatIni,
                    'required_coin' => $requiredCoin,
                    'insufficient_coin' => true
                ], 400);
            }

            Log::info('AI Fashion Photo: validation passed', $request->except(['clothing_image', 'custom_model_image']));

            $apiKey = env('FAL_API_KEY');
            if (!$apiKey || trim($apiKey) === '') {
                throw new \Exception('fal.ai API key belum dikonfigurasi.');
            }

            // Upload clothing/garment image
            $garmentUrl = $this->uploadToTemporaryStorage($request->file('clothing_image'));
            Log::info('Garment image uploaded', ['url' => $garmentUrl]);

            // Upload custom model/person image if provided
            $personUrl = null;
            if ($request->input('model_type') === 'custom' && $request->hasFile('custom_model_image')) {
                $personUrl = $this->uploadToTemporaryStorage($request->file('custom_model_image'));
                Log::info('Person image uploaded', ['url' => $personUrl]);
            }

            $photoResults = [];
            $errors = [];
            $modelType = $request->input('model_type');

            // Generate 2 variations
            for ($i = 0; $i < 2; $i++) {
                try {
                    Log::info('Generating fashion variation ' . ($i + 1));

                    // Use flux-2-lora-gallery/virtual-tryon for custom model with person image
                    if ($modelType === 'custom' && $personUrl) {
                        // Build prompt for virtual try-on
                        $prompt = $this->buildVirtualTryOnPrompt($request->all());
                        
                        // Use flux-2-lora-gallery/virtual-tryon API
                        // Format: image_urls = [person_image, garment_image]
                        $response = Http::withHeaders([
                            'Authorization' => 'Key ' . $apiKey,
                            'Content-Type' => 'application/json',
                        ])
                        ->timeout(180)
                        ->post('https://fal.run/fal-ai/flux-2-lora-gallery/virtual-tryon', [
                            'image_urls' => [$personUrl, $garmentUrl],
                            'prompt' => $prompt,
                            'guidance_scale' => 2.5,
                            'num_inference_steps' => 40,
                            'acceleration' => 'regular',
                            'output_format' => 'png',
                            'num_images' => 1,
                            'lora_scale' => 1,
                            'seed' => rand(1, 999999), // Random seed for variation
                            'enable_safety_checker' => true,
                        ]);

                        Log::info('Virtual try-on API called', [
                            'person_url' => $personUrl,
                            'garment_url' => $garmentUrl,
                            'prompt' => $prompt
                        ]);
                    } else {
                        // Use nano-banana for non-custom modes (manusia, manekin, tanpa_model)
                        $prompt = $this->buildFashionPrompt($request->all());
                        Log::info('Fashion prompt built', ['prompt' => $prompt]);

                        $response = Http::withHeaders([
                            'Authorization' => 'Key ' . $apiKey,
                            'Content-Type' => 'application/json',
                        ])
                        ->timeout(180)
                        ->post('https://fal.run/fal-ai/nano-banana/edit', [
                            'prompt' => $prompt,
                            'image_urls' => [$garmentUrl],
                            'num_images' => 1,
                            'aspect_ratio' => $request->input('aspect_ratio'),
                            'output_format' => 'png',
                        ]);
                    }

                    if ($response->successful()) {
                        $result = $response->json();
                        Log::info('Fashion response for variation ' . ($i + 1), ['result' => $result]);

                        // Handle response format - both APIs return images[].url
                        $generatedImageUrl = null;
                        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
                            $generatedImageUrl = $result['images'][0]['url'];
                        }

                        if ($generatedImageUrl) {
                            $imageContent = file_get_contents($generatedImageUrl);
                            $filename = 'fashion-photo-' . Str::uuid() . '.png';
                            $path = 'ai-fashion-photos/' . $filename;

                            Storage::disk('public')->put($path, $imageContent);
                            $savedImageUrl = str_replace('http://', 'https://', url('storage/' . $path));

                            $photoResults[] = [
                                'id' => (string) Str::uuid(),
                                'imageUrl' => $savedImageUrl,
                                'filename' => $filename,
                                'model' => $modelType === 'custom' ? 'virtual-tryon' : 'nano-banana'
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
            $this->cleanupTempFile($garmentUrl);
            if ($personUrl) {
                $this->cleanupTempFile($personUrl);
            }

            if (empty($photoResults)) {
                throw new \Exception('Gagal generate foto. ' . implode('; ', $errors));
            }

            // Save to history and deduct coin using DB transaction
            DB::beginTransaction();
            try {
                $modelType = $request->input('model_type');
                $visualStyle = $request->input('visual_style');

                foreach ($photoResults as $photo) {
                    // Save history
                    AiGenerationHistory::create([
                        'uuid_user' => $user->uuid,
                        'keterangan' => "Generate AI Foto Fashion - {$modelType} {$visualStyle}",
                        'hasil_generated' => $photo['imageUrl'],
                        'coin_used' => 1,
                    ]);

                    // Deduct coin
                    CoinTransaction::create([
                        'uuid_user' => $user->uuid,
                        'keterangan' => "Generate AI Foto Fashion - {$modelType} {$visualStyle}",
                        'coin_masuk' => 0,
                        'coin_keluar' => 1,
                        'status' => 'berhasil',
                    ]);
                }

                DB::commit();
                Log::info('Fashion photo history saved and coins deducted successfully', [
                    'user_uuid' => $user->uuid,
                    'photos_count' => count($photoResults),
                    'total_coin_used' => count($photoResults) * 1
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error saving history/deducting coin:', ['error' => $e->getMessage()]);
                // Continue anyway, photos were generated successfully
            }

            return response()->json([
                'success' => true,
                'message' => 'Fashion photos generated successfully. ' . (count($photoResults) * 1) . ' Pts deducted.',
                'data' => $photoResults,
                'errors' => $errors,
                'coin_deducted' => count($photoResults) * 1
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
     * Build prompt for virtual try-on (flux-2-lora-gallery/virtual-tryon)
     */
    private function buildVirtualTryOnPrompt(array $data): string
    {
        $location = $data['location'];
        $visualStyle = $data['visual_style'];
        $additionalInstruction = $data['additional_instruction'] ?? '';

        // Location text
        $locationText = $location === 'indoor' ? 'indoor studio setting' : 'outdoor natural setting';

        // Visual style mapping
        $styleMap = [
            'natural' => 'natural lighting with soft tones',
            'minimalis' => 'minimalist studio with clean background',
            'sunset' => 'golden hour sunset lighting with warm tones',
            'urban' => 'urban street style with city background',
            'elegan' => 'elegant sophisticated luxury feel'
        ];
        $styleText = $styleMap[$visualStyle] ?? $visualStyle;

        // Build virtual try-on prompt
        $prompt = "Virtual try-on of the clothing on the person, professional fashion photoshoot, "
            . "{$locationText}, {$styleText}, high quality, photorealistic, detailed";

        // Add additional instructions if provided
        if ($additionalInstruction) {
            $prompt .= ", {$additionalInstruction}";
        }

        return $prompt;
    }

    /**
     * Build prompt for fashion photo generation (for non-virtual-tryon modes)
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
