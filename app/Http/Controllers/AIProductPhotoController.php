<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AIProductPhotoController extends Controller
{
    /**
     * Generate foto produk:
     * produk asli dipertahankan, background + pencahayaan diganti.
     */
    public function generateProductPhoto(Request $request): JsonResponse
    {
        try {
            // 1. Validasi input dari frontend
            $request->validate([
                'image'                  => 'required|image|max:10240',
                'lighting'               => 'required|string|in:light,dark',
                'ambiance'               => 'required|string|in:clean,crowd',
                'location'               => 'nullable|string|in:indoor,outdoor',
                'aspect_ratio'           => 'required|string|in:1:1,3:4,16:9,9:16',
                'additional_instructions'=> 'nullable|string|max:500',
            ]);

            Log::info('AI Product Photo: validation passed');

            $lighting     = $request->input('lighting');
            $ambiance     = $request->input('ambiance');
            $location     = $request->input('location', 'indoor');
            $aspectRatio  = $request->input('aspect_ratio');
            $additional   = $request->input('additional_instructions', '');

            // 2. API key Stability
            $apiKey = env('STABILITY_API_KEY');
            if (!$apiKey || trim($apiKey) === '') {
                Log::error('Stability AI API key not configured');
                throw new \Exception('Stability AI API key belum dikonfigurasi. Silakan hubungi administrator.');
            }

            // 3. Resize subject image ke resolusi SDXL (supaya proporsional dan tidak error)
            $subjectPath  = $request->file('image')->getRealPath();
            $subjectImage = $this->resizeImageForSDXL($subjectPath, $aspectRatio);
            Log::info('Subject image resized for SDXL', ['aspect_ratio' => $aspectRatio]);

            // 4. Bangun background_prompt ala Gemini (lighting / ambiance / location)
            $backgroundPrompt = $this->buildGeminiStyleBackgroundPrompt(
                $lighting,
                $ambiance,
                $location,
                $additional
            );
            Log::info('Generated background prompt', ['prompt' => $backgroundPrompt]);

            // 5. Parameter untuk endpoint replace-background-and-relight
            $params = [
                'output_format'            => 'png',
                'background_prompt'        => $backgroundPrompt,
                'foreground_prompt'        => '',      // bisa diisi kalau mau styling produk
                'negative_prompt'          => '',
                'preserve_original_subject'=> 0.8,     // 0–1; makin tinggi makin mirip foto asli
                'original_background_depth'=> 0.4,
                'keep_original_background' => 'false',
                'seed'                     => 0,
                'light_source_strength'    => 0.3,
                'light_source_direction'   => 'above',
            ];

            $photoResults = [];
            $errors       = [];

            // 6. Generate 4 variasi (4 request, seed beda)
            for ($i = 0; $i < 4; $i++) {
                try {
                    Log::info('Generating variation (replace-background) ' . ($i + 1));

                    $multipartParams = $this->buildMultipartParams($params);

                    $response = Http::withHeaders([
                            'Authorization' => 'Bearer ' . $apiKey,
                        ])
                        ->timeout(120)
                        ->asMultipart()
                        ->attach('subject_image', $subjectImage, 'subject.png')
                        ->post(
                            'https://api.stability.ai/v2beta/stable-image/edit/replace-background-and-relight',
                            $multipartParams
                        );

                    if ($response->successful()) {
                        // Endpoint ini mengembalikan binary image langsung
                        $binary   = $response->body();
                        $filename = 'product-photo-' . Str::uuid() . '.png';
                        $path     = 'ai-product-photos/' . $filename;

                        Storage::disk('public')->put($path, $binary);

                        $url = str_replace('http://', 'https://', url('storage/' . $path));

                        $photoResults[] = [
                            'id'       => (string) Str::uuid(),
                            'imageUrl' => $url,
                        ];
                    } else {
                        $errors[] = 'HTTP ' . $response->status() . ': ' . $response->body();
                        Log::error('Stability HTTP error', [
                            'status' => $response->status(),
                            'body'   => $response->body(),
                        ]);
                    }

                    // Seed baru untuk variasi berikutnya
                    if ($i < 3) {
                        $params['seed'] = random_int(1, 999999999);
                        sleep(1);
                    }
                } catch (\Exception $e) {
                    $errors[] = 'Error var ' . ($i + 1) . ': ' . $e->getMessage();
                    Log::error('Error generating variation', ['error' => $e->getMessage()]);
                }
            }

            if (empty($photoResults)) {
                throw new \Exception('Gagal generate foto produk. ' . implode(' | ', $errors));
            }

            return response()->json([
                'success' => true,
                'message' => 'Product photos generated successfully (replace background)',
                'data'    => $photoResults,
                'errors'  => $errors,
            ]);
        } catch (\Exception $e) {
            Log::error('Product photo generation error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bangun background_prompt dengan gaya pilihan ala Gemini.
     */
    private function buildGeminiStyleBackgroundPrompt(
        string $lighting,
        string $ambiance,
        string $location,
        string $additional
    ): string {
        $lightingMap = [
            'light' => 'pencahayaan daylight yang cerah, soft shadow, tampak segar',
            'dark'  => 'pencahayaan dramatis, kontras tinggi, mood sinematik',
        ];

        $ambianceMap = [
            'clean' => 'background studio minimalis, bersih, polos, fokus ke produk',
            'crowd' => 'setting lifestyle dengan lingkungan sekitar yang relevan, terasa nyata',
        ];

        $locationMap = [
            'indoor'  => 'interior ruangan yang cozy dan modern',
            'outdoor' => 'lingkungan luar ruangan dengan elemen alam atau taman atau kota',
        ];

        $lightingDesc = $lightingMap[$lighting] ?? $lightingMap['light'];
        $ambianceDesc = $ambianceMap[$ambiance] ?? $ambianceMap['clean'];

        $prompt = "Foto produk komersial profesional dengan latar baru. "
            . "Fokus utama tetap pada produk di tengah gambar, tajam dan jelas. "
            . "{$lightingDesc}, {$ambianceDesc}";

        if ($ambiance === 'crowd') {
            $locationDesc = $locationMap[$location] ?? $locationMap['indoor'];
            $prompt      .= ", {$locationDesc}";
        }

        if (!empty($additional)) {
            $prompt .= ", {$additional}";
        }

        $prompt .= ", komposisi rapi, depth of field, background sedikit blur, resolusi tinggi, kualitas iklan profesional";

        return $prompt;
    }

    /**
     * Ubah array params menjadi format multipart untuk Http::asMultipart().
     */
    private function buildMultipartParams(array $params): array
    {
        $multipart = [];
        foreach ($params as $key => $value) {
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }
            $multipart[] = [
                'name'     => $key,
                'contents' => (string) $value,
            ];
        }
        return $multipart;
    }

    /**
     * Resize image ke dimensi kompatibel SDXL berdasarkan aspect ratio.
     */
    private function resizeImageForSDXL(string $imagePath, string $aspectRatio): string
    {
        $dimensionsMap = [
            '1:1'  => [1024, 1024],
            '3:4'  => [896, 1152],
            '16:9' => [1344, 768],
            '9:16' => [768, 1344],
        ];

        $dimensions   = $dimensionsMap[$aspectRatio] ?? [1024, 1024];
        $targetWidth  = $dimensions[0];
        $targetHeight = $dimensions[1];

        $imageInfo = getimagesize($imagePath);
        $mimeType  = $imageInfo['mime'] ?? null;

        switch ($mimeType) {
            case 'image/jpeg':
                $sourceImage = imagecreatefromjpeg($imagePath);
                break;
            case 'image/png':
                $sourceImage = imagecreatefrompng($imagePath);
                break;
            case 'image/webp':
                $sourceImage = imagecreatefromwebp($imagePath);
                break;
            default:
                throw new \Exception('Unsupported image format. Please use JPG, PNG, or WEBP.');
        }

        $resizedImage = imagecreatetruecolor($targetWidth, $targetHeight);

        if ($mimeType === 'image/png') {
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);
            $transparent = imagecolorallocatealpha($resizedImage, 255, 255, 255, 127);
            imagefilledrectangle($resizedImage, 0, 0, $targetWidth, $targetHeight, $transparent);
        } else {
            $white = imagecolorallocate($resizedImage, 255, 255, 255);
            imagefilledrectangle($resizedImage, 0, 0, $targetWidth, $targetHeight, $white);
        }

        $sourceWidth  = imagesx($sourceImage);
        $sourceHeight = imagesy($sourceImage);

        $sourceAspect = $sourceWidth / $sourceHeight;
        $targetAspect = $targetWidth / $targetHeight;

        if ($sourceAspect > $targetAspect) {
            $scaledHeight = $targetHeight;
            $scaledWidth  = (int) ($targetHeight * $sourceAspect);
            $offsetX      = (int) (($targetWidth - $scaledWidth) / 2);
            $offsetY      = 0;
        } else {
            $scaledWidth  = $targetWidth;
            $scaledHeight = (int) ($targetWidth / $sourceAspect);
            $offsetX      = 0;
            $offsetY      = (int) (($targetHeight - $scaledHeight) / 2);
        }

        imagecopyresampled(
            $resizedImage,
            $sourceImage,
            $offsetX,
            $offsetY,
            0,
            0,
            $scaledWidth,
            $scaledHeight,
            $sourceWidth,
            $sourceHeight
        );

        ob_start();
        imagepng($resizedImage, null, 9);
        $imageContent = ob_get_clean();

        imagedestroy($sourceImage);
        imagedestroy($resizedImage);

        return $imageContent;
    }

    /**
     * Endpoint test.
     */
    public function testEndpoint(): JsonResponse
    {
        return response()->json([
            'success'              => true,
            'message'              => 'AI Product Photo Controller (Replace Background) is working',
            'php_version'          => PHP_VERSION,
            'stability_configured' => !empty(env('STABILITY_API_KEY')),
            'gd_enabled'           => extension_loaded('gd'),
        ]);
    }
}
