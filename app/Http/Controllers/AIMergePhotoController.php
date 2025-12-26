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

            $photoResults = [];
            $errors = [];

            // Generate 4 variations using nano-banana edit (sesuai sulapfoto_rapih.txt yang generate 4 variasi)
            for ($i = 1; $i <= 2; $i++) {
                try {
                    Log::info('Generating merge variation ' . $i . ' with nano-banana');

                    // Build prompt dengan variation number (sesuai format sulapfoto_rapih.txt)
                    $prompt = $this->buildMergePrompt($instruction, count($imageUrls), $aspectRatio, $i);

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
                        Log::info('nano-banana response for variation ' . $i, ['result' => $result]);

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
                                'prompt' => $prompt,
                                'variation' => $i
                            ];
                        } else {
                            $errors[] = 'No image in response for variation ' . $i;
                        }
                    } else {
                        $errorMsg = 'fal.ai error on variation ' . $i;
                        Log::error($errorMsg, ['status' => $response->status(), 'body' => $response->body()]);
                        $errors[] = $errorMsg . ': ' . $response->body();
                    }

                    // Delay between requests to avoid rate limiting
                    if ($i < 4) sleep(2);
                } catch (\Exception $e) {
                    Log::error('Error generating variation ' . $i, ['error' => $e->getMessage()]);
                    $errors[] = 'Error variation ' . $i . ': ' . $e->getMessage();
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
     * Menggunakan fal.ai dengan Gemini 2 Flash untuk analisis gambar dan generate instruksi kreatif (TEXT only)
     * Sesuai dengan sulapfoto_rapih.txt
     */
    public function generateInstruction(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'images' => 'required|array|min:2|max:5',
                'images.*' => 'required|image|max:10240',
            ]);

            // Get fal.ai API key
            $apiKey = env('FAL_API_KEY');
            if (!$apiKey || trim($apiKey) === '') {
                Log::warning('FAL_API_KEY not configured, using fallback');
                return $this->getFallbackInstruction();
            }

            // Upload images to temporary storage untuk fal.ai
            $imageUrls = [];
            foreach ($request->file('images') as $uploadedFile) {
                $imageUrl = $this->uploadToTemporaryStorage($uploadedFile);
                $imageUrls[] = $imageUrl;
            }

            // Prompt untuk analisis gambar dan generate instruksi kreatif
            // Sesuai dengan sulapfoto_rapih.txt
            $prompt = "You are a creative assistant. Analyze these images and generate a short, creative prompt in Indonesian that describes how to merge them into a single, cohesive new image. Describe the desired style and subject matter. For example, if you see a cat and an astronaut, you could suggest: 'Seekor kucing lucu sebagai astronot, mengambang di luar angkasa dengan latar belakang nebula berwarna-warni, gaya seni digital.'. Respond ONLY with the prompt text itself in Indonesian, without any introductory phrases. Buatkan instruksi untuk menggabungkan gambar-gambar ini:";

            Log::info('Calling fal.ai Gemini 2 Flash for instruction generation (text only)', [
                'image_count' => count($imageUrls),
                'image_urls' => $imageUrls
            ]);

            // Call fal.ai dengan Gemini 2 Flash model (TEXT/VISION model, bukan image generation)
            $response = Http::withHeaders([
                'Authorization' => 'Key ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(90)
            ->post('https://fal.run/fal-ai/gemini-2-flash', [
                'prompt' => $prompt,
                'image_urls' => $imageUrls,
            ]);

            Log::info('fal.ai Gemini 2 Flash raw response', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            // Cleanup temp files setelah API call
            foreach ($imageUrls as $url) {
                $this->cleanupTempFile($url);
            }

            if ($response->successful()) {
                $result = $response->json();
                
                Log::info('fal.ai Gemini 2 Flash response parsed', ['result' => $result]);
                
                // Extract text from response - check multiple possible fields
                $instruction = null;
                
                if (isset($result['output'])) {
                    $instruction = trim($result['output']);
                } elseif (isset($result['text'])) {
                    $instruction = trim($result['text']);
                } elseif (isset($result['response'])) {
                    $instruction = trim($result['response']);
                } elseif (isset($result['content'])) {
                    $instruction = trim($result['content']);
                } elseif (isset($result['result'])) {
                    $instruction = trim($result['result']);
                } elseif (isset($result['message'])) {
                    $instruction = trim($result['message']);
                }
                
                if ($instruction && strlen($instruction) > 10) {
                    // Clean up instruction - remove quotes if present
                    $instruction = trim($instruction, '"\'');
                    
                    Log::info('AI generated instruction successfully', ['instruction' => $instruction]);
                    
                    return response()->json([
                        'success' => true,
                        'instruction' => $instruction,
                        'source' => 'fal_ai_gemini'
                    ]);
                }
            }

            // Log error details
            Log::warning('fal.ai Gemini 2 Flash API failed or empty response', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            
            return $this->getFallbackInstruction();

        } catch (\Exception $e) {
            Log::error('Generate instruction error:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->getFallbackInstruction();
        }
    }

    /**
     * Fallback instruction when fal.ai Gemini API is not available
     */
    private function getFallbackInstruction(): JsonResponse
    {
        $suggestions = [
            'Gabungkan orang di foto pertama dengan produk di foto lainnya, seolah orang tersebut sedang memegang atau menggunakan produk dengan gaya foto profesional dan pencahayaan yang natural.',
            'Kombinasikan model dengan background dari foto lain untuk membuat foto promosi yang menarik dengan pencahayaan yang konsisten dan atmosfer yang harmonis.',
            'Gabungkan beberapa produk menjadi satu foto katalog dengan layout yang rapi, profesional, dan estetik dengan latar belakang yang bersih.',
            'Buat komposisi kreatif dengan menggabungkan elemen-elemen dari setiap foto menjadi satu karya baru yang unik dengan gaya seni digital yang modern.',
            'Gabungkan foto produk dengan lifestyle scene untuk membuat foto iklan yang menarik dan eye-catching dengan nuansa yang warm dan inviting.',
            'Buat montase foto yang menggabungkan semua gambar dengan transisi yang halus dan artistik, menggunakan gaya seni digital yang contemporary.',
            'Kombinasikan subjek dari foto pertama dengan latar belakang dari foto kedua, dengan pencahayaan yang harmonis dan perspektif yang natural.',
            'Gabungkan elemen-elemen terbaik dari setiap foto menjadi satu komposisi yang seamless dan profesional dengan kualitas high-end.',
        ];
        
        $randomInstruction = $suggestions[array_rand($suggestions)];

        return response()->json([
            'success' => true,
            'instruction' => $randomInstruction,
            'source' => 'fallback'
        ]);
    }

    /**
     * Build prompt for merging images
     * Disesuaikan dengan format prompt dari sulapfoto_rapih.txt
     */
    private function buildMergePrompt(string $instruction, int $imageCount, string $aspectRatio, int $variationNumber = 1): string
    {
        // Format prompt sesuai dengan sulapfoto_rapih.txt:
        // "${ggPromptInput.value.trim()}. The final image must have an aspect ratio of ${aspectRatio}. This is variation number ${id}."
        return "{$instruction}. The final image must have an aspect ratio of {$aspectRatio}. This is variation number {$variationNumber}. "
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
