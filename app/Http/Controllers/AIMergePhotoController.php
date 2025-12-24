<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AIMergePhotoController extends Controller
{
    /**
     * Generate merged/combined photo from multiple images using nano-banana edit
     */
    public function generateMergedPhoto(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'images' => 'required|array|min:2|max:5',
                'images.*' => 'required|image|max:10240',
                'instruction' => 'required|string|max:1000',
                'aspect_ratio' => 'required|string|in:1:1,16:9,9:16',
            ]);

            Log::info('AI Merge Photo (nano-banana): validation passed', [
                'image_count' => count($request->file('images')),
                'instruction' => $request->input('instruction'),
                'aspect_ratio' => $request->input('aspect_ratio')
            ]);

            $instruction = $request->input('instruction');
            $aspectRatio = $request->input('aspect_ratio');

            // API key fal.ai
            $apiKey = env('FAL_API_KEY');
            if (!$apiKey || trim($apiKey) === '') {
                throw new \Exception('fal.ai API key belum dikonfigurasi.');
            }

            // Upload all images to temporary storage
            $imageUrls = [];
            foreach ($request->file('images') as $uploadedFile) {
                $imageUrl = $this->uploadToTemporaryStorage($uploadedFile);
                $imageUrls[] = $imageUrl;
                Log::info('Image uploaded', ['url' => $imageUrl]);
            }

            // Build prompt for merging
            $prompt = $this->buildMergePrompt($instruction, count($imageUrls));

            $photoResults = [];
            $errors = [];

            // Generate 2 variations using nano-banana edit
            for ($i = 0; $i < 2; $i++) {
                try {
                    Log::info('Generating merge variation ' . ($i + 1) . ' with nano-banana');

                    // Use nano-banana edit endpoint (same as product photo)
                    $response = Http::withHeaders([
                        'Authorization' => 'Key ' . $apiKey,
                        'Content-Type' => 'application/json',
                    ])
                    ->timeout(180)
                    ->post('https://fal.run/fal-ai/nano-banana/edit', [
                        'prompt' => $prompt,
                        'image_urls' => $imageUrls,
                        'num_images' => 1,
                        'aspect_ratio' => $aspectRatio,
                        'output_format' => 'png',
                    ]);

                    if ($response->successful()) {
                        $result = $response->json();
                        Log::info('nano-banana response for variation ' . ($i + 1), ['result' => $result]);

                        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
                            $generatedImageUrl = $result['images'][0]['url'];

                            // Download and save
                            $imageContent = file_get_contents($generatedImageUrl);
                            $filename = 'merged-photo-' . Str::uuid() . '.png';
                            $path = 'ai-merged-photos/' . $filename;

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
            foreach ($imageUrls as $url) {
                $this->cleanupTempFile($url);
            }

            if (empty($photoResults)) {
                throw new \Exception('Gagal generate foto. ' . implode('; ', $errors));
            }

            return response()->json([
                'success' => true,
                'message' => 'Merged photos generated successfully (nano-banana)',
                'data' => $photoResults,
                'errors' => $errors,
            ]);

        } catch (\Exception $e) {
            Log::error('Merge photo error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate instruction suggestion based on uploaded images
     * Returns a default creative instruction since vision analysis may not be available
     */
    public function generateInstruction(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'images' => 'required|array|min:2|max:5',
                'images.*' => 'required|image|max:10240',
            ]);

            $imageCount = count($request->file('images'));
            
            // Generate creative instruction suggestions based on image count
            $suggestions = [
                2 => [
                    'Gabungkan kedua gambar ini menjadi satu komposisi yang harmonis, dengan transisi yang halus antara elemen-elemen utama.',
                    'Kombinasikan subjek dari foto pertama dengan latar belakang foto kedua secara natural.',
                    'Buat kolase kreatif yang menggabungkan elemen terbaik dari kedua foto dengan pencahayaan yang konsisten.',
                    'Satukan kedua gambar dengan blending yang smooth, pertahankan detail penting dari masing-masing foto.',
                ],
                3 => [
                    'Gabungkan ketiga gambar ini menjadi satu panorama atau kolase yang menarik dengan transisi seamless.',
                    'Kombinasikan elemen utama dari setiap foto menjadi satu komposisi yang kohesif dan profesional.',
                    'Buat montase kreatif dari ketiga foto dengan pencahayaan dan warna yang seragam.',
                ],
                4 => [
                    'Susun keempat gambar menjadi grid atau kolase artistik dengan tema yang konsisten.',
                    'Gabungkan elemen-elemen penting dari setiap foto menjadi satu karya visual yang menarik.',
                    'Buat komposisi kreatif yang menggabungkan keempat foto dengan transisi yang halus.',
                ],
                5 => [
                    'Kombinasikan kelima gambar menjadi satu montase atau kolase yang eye-catching.',
                    'Gabungkan semua elemen dari foto-foto ini menjadi satu komposisi panoramik yang menakjubkan.',
                    'Buat karya visual yang menggabungkan kelima foto dengan tema dan warna yang harmonis.',
                ],
            ];

            $availableSuggestions = $suggestions[$imageCount] ?? $suggestions[2];
            $randomInstruction = $availableSuggestions[array_rand($availableSuggestions)];

            return response()->json([
                'success' => true,
                'instruction' => $randomInstruction,
            ]);

        } catch (\Exception $e) {
            Log::error('Generate instruction error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => true,
                'instruction' => 'Gabungkan semua elemen dari foto-foto ini menjadi satu komposisi yang harmonis dan menarik.',
            ]);
        }
    }

    /**
     * Build prompt for merging images
     */
    private function buildMergePrompt(string $instruction, int $imageCount): string
    {
        return "Combine and merge these {$imageCount} images into one cohesive composition. "
            . "Instructions: {$instruction}. "
            . "Create a seamless blend with consistent lighting, colors, and perspective. "
            . "Professional quality, high resolution, photorealistic result.";
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
     * Download merged photo
     */
    public function downloadMergedPhoto(string $filename)
    {
        try {
            $path = 'ai-merged-photos/' . $filename;

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
            'message' => 'AI Merge Photo Controller is working',
            'fal_configured' => !empty(env('FAL_API_KEY')),
        ]);
    }
}
