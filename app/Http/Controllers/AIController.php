<?php

namespace App\Http\Controllers;

use App\Models\AiGenerationHistory;
use App\Models\CoinTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AIController extends Controller
{
    /**
     * Generate logo using fal.ai FLUX 2 Pro
     * FLUX 2 Pro delivers state-of-the-art image quality with excellent prompt adherence
     */
    public function generateLogo(Request $request): JsonResponse
    {
        Log::info('=== AI Logo Generation Request Started (fal.ai FLUX 2 Pro) ===');
        Log::info('Request data:', $request->all());

        try {
            $request->validate([
                'business_name' => 'required|string|max:200',
                'prompt' => 'required|string|max:1000',
                'style' => 'required|string|in:modern,simple,creative,minimalist,professional,playful,elegant,bold',
                'image' => 'nullable|image|max:5120'
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
                    'message' => "Coin tidak cukup! Anda memiliki {$coinSaatIni} Pts, membutuhkan {$requiredCoin} Pts untuk generate 2 logo.",
                    'current_coin' => $coinSaatIni,
                    'required_coin' => $requiredCoin,
                    'insufficient_coin' => true
                ], 400);
            }

            $businessName = $request->input('business_name');
            $prompt = $request->input('prompt');
            $style = $request->input('style');

            // Get fal.ai API key
            $apiKey = env('FAL_API_KEY');
            if (!$apiKey || empty(trim($apiKey))) {
                Log::error('fal.ai API key not configured');
                throw new \Exception('fal.ai API key belum dikonfigurasi. Silakan hubungi administrator.');
            }

            // Generate 2 logo variations
            $logoResults = [];
            $errors = [];

            for ($i = 0; $i < 2; $i++) {
                try {
                    // Build logo prompt
                    $logoPrompt = $this->buildLogoPrompt($businessName, $prompt, $style, $i + 1);
                    
                    Log::info("Generating logo variation " . ($i + 1), ['prompt' => $logoPrompt]);

                    // Call fal.ai FLUX 2 Pro API
                    $response = Http::withHeaders([
                        'Authorization' => 'Key ' . $apiKey,
                        'Content-Type' => 'application/json',
                    ])->timeout(120)->post('https://fal.run/fal-ai/flux-2-pro', [
                        'prompt' => $logoPrompt,
                        'image_size' => 'square_hd',  // 1024x1024 HD
                        'num_inference_steps' => 30,
                        'guidance_scale' => 8.0,
                        'num_images' => 1,
                        'enable_safety_checker' => false,
                    ]);

                    if ($response->successful()) {
                        $result = $response->json();
                        Log::info("fal.ai FLUX 2 Pro response for variation " . ($i + 1), ['result' => $result]);

                        // FLUX 2 Pro returns images array with url
                        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
                            $imageUrl = $result['images'][0]['url'] ?? null;

                            if ($imageUrl) {
                                // Download and save image
                                $imageContent = file_get_contents($imageUrl);
                                $filename = 'logo-' . Str::uuid() . '.png';
                                $path = 'ai-logos/' . $filename;

                                // Process: remove white background
                                try {
                                    $processedImage = $this->removeWhiteBackground($imageContent);
                                    Storage::disk('public')->put($path, $processedImage);
                                    Log::info("Background removed for variation " . ($i + 1));
                                } catch (\Exception $e) {
                                    Log::warning("Background removal failed: " . $e->getMessage());
                                    Storage::disk('public')->put($path, $imageContent);
                                }

                                $savedImageUrl = str_replace('http://', 'https://', url('storage/' . $path));

                                $logoResults[] = [
                                    'id' => (string) Str::uuid(),
                                    'imageUrl' => $savedImageUrl,
                                    'filename' => $filename,
                                    'prompt' => $logoPrompt
                                ];
                            }
                        } else {
                            $errors[] = "No image in response for variation " . ($i + 1);
                        }
                    } else {
                        $errorMsg = 'fal.ai API error on variation ' . ($i + 1);
                        Log::error($errorMsg, ['status' => $response->status(), 'body' => $response->body()]);
                        $errors[] = $errorMsg . ': ' . $response->body();
                    }

                    if ($i < 1) sleep(1);
                } catch (\Exception $e) {
                    Log::error('Error generating variation ' . ($i + 1), ['error' => $e->getMessage()]);
                    $errors[] = 'Error variation ' . ($i + 1) . ': ' . $e->getMessage();
                }
            }

            if (empty($logoResults)) {
                throw new \Exception('Failed to generate logos. ' . implode('; ', $errors));
            }

            // Save to history and deduct coin using DB transaction
            DB::beginTransaction();
            try {
                foreach ($logoResults as $logo) {
                    // Save history
                    AiGenerationHistory::create([
                        'uuid_user' => $user->uuid,
                        'keterangan' => "Generate AI Logo - {$businessName}",
                        'hasil_generated' => $logo['imageUrl'],
                        'coin_used' => 1,
                    ]);

                    // Deduct coin
                    CoinTransaction::create([
                        'uuid_user' => $user->uuid,
                        'keterangan' => "Generate AI Logo - {$businessName}",
                        'coin_masuk' => 0,
                        'coin_keluar' => 1,
                        'status' => 'berhasil',
                    ]);
                }

                DB::commit();
                Log::info('History saved and coins deducted successfully', [
                    'user_uuid' => $user->uuid,
                    'logos_count' => count($logoResults),
                    'total_coin_used' => count($logoResults) * 1
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error saving history/deducting coin:', ['error' => $e->getMessage()]);
                // Continue anyway, logos were generated successfully
            }

            return response()->json([
                'success' => true,
                'message' => 'Logos generated successfully. ' . (count($logoResults) * 1) . ' Pts deducted.',
                'data' => $logoResults,
                'errors' => $errors,
                'coin_deducted' => count($logoResults) * 1
            ]);

        } catch (\Exception $e) {
            Log::error('Logo generation error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat logo. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Build prompt for logo generation
     */
    private function buildLogoPrompt(string $businessName, string $userPrompt, string $style, int $variation): string
    {
        $styleMap = [
            'modern'       => 'modern minimalist',
            'simple'       => 'simple clean',
            'creative'     => 'creative unique',
            'minimalist'   => 'ultra minimalist',
            'professional' => 'professional corporate',
            'playful'      => 'playful friendly',
            'elegant'      => 'elegant sophisticated',
            'bold'         => 'bold impactful',
        ];

        $styleDesc = $styleMap[$style] ?? 'modern minimalist';

        return "Create a single {$styleDesc} logo for '{$businessName}'. "
            . "Design: simple icon on left, brand name text '{$businessName}' on right, horizontally aligned. "
            . "Style: flat vector, clean lines, 2-3 colors maximum. "
            . "Concept: {$userPrompt}. "
            . "White background, centered, professional quality. "
            . "Variation {$variation}.";
    }

    /**
     * Remove white background and make transparent
     */
    private function removeWhiteBackground(string $imageContent): string
    {
        if (!extension_loaded('gd')) {
            return $imageContent;
        }

        try {
            $oldMemoryLimit = ini_get('memory_limit');
            ini_set('memory_limit', '512M');

            $image = @imagecreatefromstring($imageContent);
            if (!$image) {
                ini_set('memory_limit', $oldMemoryLimit);
                return $imageContent;
            }

            $width = imagesx($image);
            $height = imagesy($image);

            $transparent = imagecreatetruecolor($width, $height);
            imagealphablending($transparent, false);
            imagesavealpha($transparent, true);

            $transparentColor = imagecolorallocatealpha($transparent, 0, 0, 0, 127);
            imagefill($transparent, 0, 0, $transparentColor);

            $tolerance = 30;

            for ($x = 0; $x < $width; $x++) {
                for ($y = 0; $y < $height; $y++) {
                    $rgb = imagecolorat($image, $x, $y);
                    $colors = imagecolorsforindex($image, $rgb);

                    if ($colors['red'] >= (255 - $tolerance) &&
                        $colors['green'] >= (255 - $tolerance) &&
                        $colors['blue'] >= (255 - $tolerance)) {
                        $newColor = imagecolorallocatealpha($transparent, $colors['red'], $colors['green'], $colors['blue'], 127);
                    } else {
                        $newColor = imagecolorallocatealpha($transparent, $colors['red'], $colors['green'], $colors['blue'], $colors['alpha']);
                    }
                    imagesetpixel($transparent, $x, $y, $newColor);
                }
            }

            $transparent = $this->autoCropImage($transparent);

            ob_start();
            imagepng($transparent, null, 9);
            $processedContent = ob_get_contents();
            ob_end_clean();

            imagedestroy($image);
            imagedestroy($transparent);
            ini_set('memory_limit', $oldMemoryLimit);

            return $processedContent;
        } catch (\Throwable $e) {
            Log::error('removeWhiteBackground error: ' . $e->getMessage());
            return $imageContent;
        }
    }

    /**
     * Auto-crop transparent space
     */
    private function autoCropImage($image)
    {
        $width = imagesx($image);
        $height = imagesy($image);

        $top = $height;
        $bottom = 0;
        $left = $width;
        $right = 0;

        for ($x = 0; $x < $width; $x++) {
            for ($y = 0; $y < $height; $y++) {
                $rgb = imagecolorat($image, $x, $y);
                $colors = imagecolorsforindex($image, $rgb);

                if ($colors['alpha'] < 127) {
                    if ($x < $left) $left = $x;
                    if ($x > $right) $right = $x;
                    if ($y < $top) $top = $y;
                    if ($y > $bottom) $bottom = $y;
                }
            }
        }

        $padding = 20;
        $left = max(0, $left - $padding);
        $top = max(0, $top - $padding);
        $right = min($width - 1, $right + $padding);
        $bottom = min($height - 1, $bottom + $padding);

        $newWidth = $right - $left + 1;
        $newHeight = $bottom - $top + 1;

        if ($newWidth <= 0 || $newHeight <= 0) {
            return $image;
        }

        $cropped = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($cropped, false);
        imagesavealpha($cropped, true);

        $transparentColor = imagecolorallocatealpha($cropped, 0, 0, 0, 127);
        imagefill($cropped, 0, 0, $transparentColor);

        imagecopy($cropped, $image, 0, 0, $left, $top, $newWidth, $newHeight);
        imagedestroy($image);

        return $cropped;
    }

    /**
     * Download logo file - public endpoint without auth
     */
    public function downloadLogo(string $filename)
    {
        try {
            $path = 'ai-logos/' . $filename;

            if (!Storage::disk('public')->exists($path)) {
                return response()->json(['success' => false, 'message' => 'File not found'], 404);
            }

            $file = Storage::disk('public')->get($path);

            // Get origin from request for CORS
            $origin = request()->header('Origin', '*');

            return response($file, 200)
                ->header('Content-Type', 'image/png')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');

        } catch (\Exception $e) {
            Log::error('Download error:', ['filename' => $filename, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Gagal mengunduh file. Silakan coba lagi.'], 500);
        }
    }

    /**
     * Test endpoint
     */
    public function testEndpoint(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'AI Controller (fal.ai FLUX 2 Pro)',
            'gd_available' => extension_loaded('gd'),
            'fal_configured' => !empty(env('FAL_API_KEY'))
        ]);
    }

    /**
     * Refine logo
     */
    public function refineLogo(Request $request): JsonResponse
    {
        $request->validate([
            'original_prompt' => 'required|string',
            'refinement_instructions' => 'required|string|max:500',
            'style' => 'required|string'
        ]);

        $request->merge([
            'prompt' => $request->original_prompt . ' ' . $request->refinement_instructions
        ]);

        return $this->generateLogo($request);
    }
}
