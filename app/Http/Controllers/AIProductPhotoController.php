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
     * Generate AI product photos using Stability AI SDXL (image-to-image).
     */
    public function generate(Request $request): JsonResponse
    {
        try {
            // 1. Validasi input
            $request->validate([
                'image'                  => 'required|image|max:10240', // max 10MB
                'lighting'               => 'required|string|in:light,dark',
                'ambiance'               => 'required|string|in:clean,crowd',
                'location'               => 'nullable|string|in:indoor,outdoor',
                'aspect_ratio'           => 'required|string|in:1:1,3:4,16:9,9:16',
                'additional_instructions'=> 'nullable|string|max:500',
            ]);

            Log::info('Validation passed');

            // 2. Ambil parameter
            $lighting              = $request->input('lighting');
            $ambiance              = $request->input('ambiance');
            $location              = $request->input('location', 'indoor');
            $aspectRatio           = $request->input('aspect_ratio');
            $additionalInstructions= $request->input('additional_instructions', '');

            // 3. API key Stability
            $stabilityApiKey = env('STABILITY_API_KEY');
            if (!$stabilityApiKey || empty(trim($stabilityApiKey))) {
                Log::error('Stability AI API key not configured');
                throw new \Exception('Stability AI API key belum dikonfigurasi. Silakan hubungi administrator.');
            }

            // 4. Bangun prompt
            $prompt = $this->buildPrompt($lighting, $ambiance, $location, $additionalInstructions);
            Log::info('Generated prompt', ['prompt' => $prompt]);

            // 5. Resize image ke dimensi SDXL
            $uploadedFile  = $request->file('image');
            $imageContent  = $this->resizeImageForSDXL($uploadedFile->getRealPath(), $aspectRatio);
            Log::info('Image resized for SDXL', ['aspect_ratio' => $aspectRatio]);

            // 6. Generate 4 variasi
            $photoResults   = [];
            $errors         = [];

            // Lebih rendah supaya produk lebih mirip aslinya
            $strengthValues = [0.05, 0.07, 0.09, 0.11];

            for ($i = 0; $i < 4; $i++) {
                try {
                    $strength = $strengthValues[$i];
                    Log::info('Generating variation ' . ($i + 1) . ' with strength: ' . $strength);

                    // Payload multipart sesuai dokumentasi SDXL image-to-image
                    $response = Http::withHeaders([
                            'Authorization' => 'Bearer ' . $stabilityApiKey,
                            'Accept'        => 'application/json',
                        ])
                        ->timeout(120)
                        ->asMultipart()
                        ->attach('init_image', $imageContent, 'image.png')
                        ->post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image', [
                            [
                                'name'     => 'text_prompts[0][text]',
                                'contents' => $prompt,
                            ],
                            [
                                'name'     => 'text_prompts[0][weight]',
                                'contents' => '1',
                            ],
                            [
                                'name'     => 'cfg_scale',
                                'contents' => '5', // sedikit lebih rendah agar gambar input lebih dominan
                            ],
                            [
                                'name'     => 'samples',
                                'contents' => '1',
                            ],
                            [
                                'name'     => 'steps',
                                'contents' => '30',
                            ],
                            [
                                'name'     => 'image_strength',
                                'contents' => (string) $strength,
                            ],
                            [
                                'name'     => 'style_preset',
                                'contents' => 'photographic',
                            ],
                        ]);

                    if ($response->successful()) {
                        $result = $response->json();
                        Log::info('Stability AI response successful for variation ' . ($i + 1));

                        if (isset($result['artifacts']) && count($result['artifacts']) > 0) {
                            $base64Image = $result['artifacts'][0]['base64'];

                            // Decode & save
                            $imageData = base64_decode($base64Image);
                            $filename  = 'product-photo-' . Str::uuid() . '.png';
                            $path      = 'ai-product-photos/' . $filename;

                            Storage::disk('public')->put($path, $imageData);

                            // URL (paksa HTTPS)
                            $savedImageUrl = str_replace('http://', 'https://', url('storage/' . $path));
                            Log::info('Image saved successfully', ['path' => $savedImageUrl]);

                            $photoResults[] = [
                                'id'        => (string) Str::uuid(),
                                'imageUrl'  => $savedImageUrl,
                                'strength'  => $strength,
                            ];
                        } else {
                            $errorMsg = 'Stability AI error on variation ' . ($i + 1) . ' (no artifacts)';
                            Log::error($errorMsg, [
                                'status' => $response->status(),
                                'body'   => $response->body(),
                            ]);
                            $errors[] = $errorMsg;
                        }
                    } else {
                        $errorMsg = 'Stability AI HTTP error on variation ' . ($i + 1);
                        Log::error($errorMsg, [
                            'status' => $response->status(),
                            'body'   => $response->body(),
                        ]);
                        $errors[] = $errorMsg . ': ' . $response->body();
                    }

                    // Delay ringan antar request
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
     * Build prompt untuk Stability AI image-to-image.
     * Fokus: produk (botol) tetap sama, hanya background & scene yang berubah.
     */
    /**
 * Build prompt untuk Stability AI image-to-image.
 * Fokus: produk APA PUN tetap sama, hanya background & scene yang berubah.
 */
private function buildPrompt(string $lighting, string $ambiance, string $location, string $additionalInstructions): string
{
    $lightingDescriptions = [
        'light' => 'bright natural daylight, soft shadows, fresh atmosphere',
        'dark'  => 'dramatic moody lighting, dark background, cinematic look',
    ];

    $ambianceDescriptions = [
        'clean' => 'clean minimalist studio background, simple elegant backdrop, professional product photography',
        'crowd' => 'lifestyle setting with natural props, contextual environment, real-world scene',
    ];

    $locationDescriptions = [
        'indoor'  => 'indoor interior setting, cozy room',
        'outdoor' => 'outdoor natural environment, open air',
    ];

    $lightingDesc = $lightingDescriptions[$lighting] ?? 'bright natural daylight';
    $ambianceDesc = $ambianceDescriptions[$ambiance] ?? 'clean minimalist studio background';

    // ✅ Prompt generik untuk SEMUA produk
    $prompt = "Professional commercial product photography. "
        . "Keep the original product exactly as in the input photo, including its packaging, shape, label, logo, and colors. "
        . "Do not change, redraw, or stylize the product itself in any way. "
        . "Only change the background, environment, lighting mood, and supporting props around the product. "
        . "{$lightingDesc}, {$ambianceDesc}";

    if ($ambiance === 'crowd') {
        $locationDesc = $locationDescriptions[$location] ?? 'indoor interior setting';
        $prompt .= ", {$locationDesc}";
    }

    if (!empty($additionalInstructions)) {
        $prompt .= ", {$additionalInstructions}";
    }

    $prompt .= ", product stays identical, sharp focus on the product, realistic, high resolution, 8K quality";

    return $prompt;
}


    /**
     * Resize image ke dimensi yang kompatibel dengan SDXL berdasarkan aspect ratio.
     */
    private function resizeImageForSDXL(string $imagePath, string $aspectRatio): string
    {
        $dimensionsMap = [
            '1:1'  => [1024, 1024],
            '3:4'  => [896, 1152],   // portrait
            '16:9' => [1344, 768],   // landscape
            '9:16' => [768, 1344],   // portrait
        ];

        $dimensions   = $dimensionsMap[$aspectRatio] ?? [1024, 1024];
        $targetWidth  = $dimensions[0];
        $targetHeight = $dimensions[1];

        // Baca info gambar
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

        // Canvas baru
        $resizedImage = imagecreatetruecolor($targetWidth, $targetHeight);

        // Transparansi untuk PNG
        if ($mimeType === 'image/png') {
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);
            $transparent = imagecolorallocatealpha($resizedImage, 255, 255, 255, 127);
            imagefilledrectangle($resizedImage, 0, 0, $targetWidth, $targetHeight, $transparent);
        } else {
            // putih untuk JPG/WebP
            $white = imagecolorallocate($resizedImage, 255, 255, 255);
            imagefilledrectangle($resizedImage, 0, 0, $targetWidth, $targetHeight, $white);
        }

        // Resize dengan “cover”
        $sourceWidth  = imagesx($sourceImage);
        $sourceHeight = imagesy($sourceImage);

        $sourceAspect = $sourceWidth / $sourceHeight;
        $targetAspect = $targetWidth / $targetHeight;

        if ($sourceAspect > $targetAspect) {
            // Lebih lebar – sesuaikan tinggi
            $scaledHeight = $targetHeight;
            $scaledWidth  = (int) ($targetHeight * $sourceAspect);
            $offsetX      = (int) (($targetWidth - $scaledWidth) / 2);
            $offsetY      = 0;
        } else {
            // Lebih tinggi – sesuaikan lebar
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

        // Simpan ke buffer
        ob_start();
        imagepng($resizedImage, null, 9);
        $imageContent = ob_get_clean();

        imagedestroy($sourceImage);
        imagedestroy($resizedImage);

        return $imageContent;
    }

    /**
     * Endpoint sederhana untuk cek status.
     */
    public function testEndpoint(): JsonResponse
    {
        return response()->json([
            'success'             => true,
            'message'             => 'AI Product Photo Controller is working (Stability AI)',
            'php_version'         => PHP_VERSION,
            'stability_configured'=> !empty(env('STABILITY_API_KEY')),
            'gd_enabled'          => extension_loaded('gd'),
        ]);
    }
}
