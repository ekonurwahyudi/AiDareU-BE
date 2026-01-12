<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ConvertImagesToWebP extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'images:convert-webp 
                            {--type=all : Type to convert (all, products, slides, logos, seo)}
                            {--quality=80 : WebP quality (0-100)}
                            {--max-width=1200 : Maximum width for resizing}
                            {--dry-run : Show what would be converted without actually converting}
                            {--delete-originals : Delete original files after conversion}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Convert existing images to WebP format for better performance';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $type = $this->option('type');
        $quality = (int) $this->option('quality');
        $maxWidth = (int) $this->option('max-width');
        $dryRun = $this->option('dry-run');
        $deleteOriginals = $this->option('delete-originals');

        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No files will be modified');
        }

        $this->info("Starting image conversion to WebP (quality: {$quality}%, max-width: {$maxWidth}px)...\n");

        $stats = [
            'total' => 0,
            'converted' => 0,
            'skipped' => 0,
            'failed' => 0,
            'space_saved' => 0,
        ];

        if ($type === 'all' || $type === 'products') {
            $this->convertProductImages($quality, $maxWidth, $dryRun, $deleteOriginals, $stats);
        }

        if ($type === 'all' || $type === 'slides') {
            $this->convertSlideImages($quality, $maxWidth, $dryRun, $deleteOriginals, $stats);
        }

        if ($type === 'all' || $type === 'logos') {
            $this->convertLogoFaviconImages($quality, $maxWidth, $dryRun, $deleteOriginals, $stats);
        }

        if ($type === 'all' || $type === 'seo') {
            $this->convertSeoImages($quality, $maxWidth, $dryRun, $deleteOriginals, $stats);
        }

        // Summary
        $this->newLine();
        $this->info('═══════════════════════════════════════');
        $this->info('           CONVERSION SUMMARY           ');
        $this->info('═══════════════════════════════════════');
        $this->info("Total images found:    {$stats['total']}");
        $this->info("Successfully converted: {$stats['converted']}");
        $this->info("Skipped (already WebP): {$stats['skipped']}");
        $this->warn("Failed:                 {$stats['failed']}");
        
        $savedMB = round($stats['space_saved'] / 1024 / 1024, 2);
        $this->info("Space saved:            {$savedMB} MB");
        $this->info('═══════════════════════════════════════');

        return Command::SUCCESS;
    }

    /**
     * Convert product images
     */
    private function convertProductImages($quality, $maxWidth, $dryRun, $deleteOriginals, &$stats)
    {
        $this->info('📦 Converting Product Images...');
        
        $products = DB::table('products')
            ->whereNotNull('upload_gambar_produk')
            ->get();

        $bar = $this->output->createProgressBar($products->count());
        $bar->start();

        foreach ($products as $product) {
            $images = json_decode($product->upload_gambar_produk, true);
            
            if (!is_array($images)) {
                $bar->advance();
                continue;
            }

            $newImages = [];
            $updated = false;

            foreach ($images as $imagePath) {
                $stats['total']++;
                
                $result = $this->convertSingleImage($imagePath, $quality, $maxWidth, $dryRun, $deleteOriginals);
                
                if ($result['status'] === 'converted') {
                    $newImages[] = $result['new_path'];
                    $stats['converted']++;
                    $stats['space_saved'] += $result['saved'];
                    $updated = true;
                } elseif ($result['status'] === 'skipped') {
                    $newImages[] = $imagePath;
                    $stats['skipped']++;
                } else {
                    $newImages[] = $imagePath;
                    $stats['failed']++;
                }
            }

            // Update database if images were converted
            if ($updated && !$dryRun) {
                DB::table('products')
                    ->where('id', $product->id)
                    ->update(['upload_gambar_produk' => json_encode($newImages)]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Also convert size guide images
        $this->info('📏 Converting Size Guide Images...');
        
        $productsWithSizeGuide = DB::table('products')
            ->whereNotNull('size_guide_image')
            ->get();

        foreach ($productsWithSizeGuide as $product) {
            $stats['total']++;
            
            $result = $this->convertSingleImage($product->size_guide_image, $quality, 1500, $dryRun, $deleteOriginals);
            
            if ($result['status'] === 'converted') {
                $stats['converted']++;
                $stats['space_saved'] += $result['saved'];
                
                if (!$dryRun) {
                    DB::table('products')
                        ->where('id', $product->id)
                        ->update(['size_guide_image' => $result['new_path']]);
                }
            } elseif ($result['status'] === 'skipped') {
                $stats['skipped']++;
            } else {
                $stats['failed']++;
            }
        }

        $this->newLine();
    }

    /**
     * Convert slide images
     */
    private function convertSlideImages($quality, $maxWidth, $dryRun, $deleteOriginals, &$stats)
    {
        $this->info('🖼️  Converting Slide Images...');
        
        $slides = DB::table('slide_tokos')->get();

        foreach ($slides as $slide) {
            for ($i = 1; $i <= 5; $i++) {
                $column = "slide_$i";
                $imagePath = $slide->$column ?? null;
                
                if (!$imagePath) continue;
                
                $stats['total']++;
                
                $result = $this->convertSingleImage($imagePath, 85, 1920, $dryRun, $deleteOriginals);
                
                if ($result['status'] === 'converted') {
                    $stats['converted']++;
                    $stats['space_saved'] += $result['saved'];
                    
                    if (!$dryRun) {
                        DB::table('slide_tokos')
                            ->where('id', $slide->id)
                            ->update([$column => $result['new_path']]);
                    }
                } elseif ($result['status'] === 'skipped') {
                    $stats['skipped']++;
                } else {
                    $stats['failed']++;
                }
            }
        }

        $this->newLine();
    }

    /**
     * Convert logo and favicon images
     */
    private function convertLogoFaviconImages($quality, $maxWidth, $dryRun, $deleteOriginals, &$stats)
    {
        $this->info('🏪 Converting Logo & Favicon Images...');
        
        $settings = DB::table('setting_tokos')->get();

        foreach ($settings as $setting) {
            // Convert logo
            if ($setting->logo) {
                $stats['total']++;
                
                $result = $this->convertSingleImage($setting->logo, 90, 800, $dryRun, $deleteOriginals);
                
                if ($result['status'] === 'converted') {
                    $stats['converted']++;
                    $stats['space_saved'] += $result['saved'];
                    
                    if (!$dryRun) {
                        DB::table('setting_tokos')
                            ->where('id', $setting->id)
                            ->update(['logo' => $result['new_path']]);
                    }
                } elseif ($result['status'] === 'skipped') {
                    $stats['skipped']++;
                } else {
                    $stats['failed']++;
                }
            }

            // Convert favicon
            if ($setting->favicon) {
                $stats['total']++;
                
                $result = $this->convertSingleImage($setting->favicon, 90, 256, $dryRun, $deleteOriginals);
                
                if ($result['status'] === 'converted') {
                    $stats['converted']++;
                    $stats['space_saved'] += $result['saved'];
                    
                    if (!$dryRun) {
                        DB::table('setting_tokos')
                            ->where('id', $setting->id)
                            ->update(['favicon' => $result['new_path']]);
                    }
                } elseif ($result['status'] === 'skipped') {
                    $stats['skipped']++;
                } else {
                    $stats['failed']++;
                }
            }
        }

        $this->newLine();
    }

    /**
     * Convert SEO OG images
     */
    private function convertSeoImages($quality, $maxWidth, $dryRun, $deleteOriginals, &$stats)
    {
        $this->info('🔍 Converting SEO OG Images...');
        
        $seoSettings = DB::table('seo_tokos')->whereNotNull('og_image')->get();

        foreach ($seoSettings as $seo) {
            $stats['total']++;
            
            $result = $this->convertSingleImage($seo->og_image, 85, 1200, $dryRun, $deleteOriginals);
            
            if ($result['status'] === 'converted') {
                $stats['converted']++;
                $stats['space_saved'] += $result['saved'];
                
                if (!$dryRun) {
                    DB::table('seo_tokos')
                        ->where('id', $seo->id)
                        ->update(['og_image' => $result['new_path']]);
                }
            } elseif ($result['status'] === 'skipped') {
                $stats['skipped']++;
            } else {
                $stats['failed']++;
            }
        }

        $this->newLine();
    }

    /**
     * Convert a single image to WebP
     */
    private function convertSingleImage($relativePath, $quality, $maxWidth, $dryRun, $deleteOriginals)
    {
        $result = [
            'status' => 'failed',
            'new_path' => $relativePath,
            'saved' => 0,
        ];

        // Skip if already WebP
        if (Str::endsWith(strtolower($relativePath), '.webp')) {
            $result['status'] = 'skipped';
            return $result;
        }

        $fullPath = storage_path('app/public/' . $relativePath);

        // Check if file exists
        if (!file_exists($fullPath)) {
            $this->warn("  ⚠️  File not found: {$relativePath}");
            return $result;
        }

        // Get original file size
        $originalSize = filesize($fullPath);

        // Get mime type
        $mimeType = mime_content_type($fullPath);
        
        // Skip non-image files
        if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/gif'])) {
            $result['status'] = 'skipped';
            return $result;
        }

        if ($dryRun) {
            $this->line("  Would convert: {$relativePath}");
            $result['status'] = 'converted';
            return $result;
        }

        try {
            // Create image resource
            $sourceImage = $this->createImageResource($fullPath, $mimeType);
            
            if (!$sourceImage) {
                return $result;
            }

            // Get dimensions
            $originalWidth = imagesx($sourceImage);
            $originalHeight = imagesy($sourceImage);

            // Calculate new dimensions
            $newWidth = $originalWidth;
            $newHeight = $originalHeight;

            if ($maxWidth && $originalWidth > $maxWidth) {
                $ratio = $maxWidth / $originalWidth;
                $newWidth = $maxWidth;
                $newHeight = (int) ($originalHeight * $ratio);
            }

            // Create new image
            $newImage = imagecreatetruecolor($newWidth, $newHeight);

            // Preserve transparency for PNG
            if ($mimeType === 'image/png') {
                imagealphablending($newImage, false);
                imagesavealpha($newImage, true);
                $transparent = imagecolorallocatealpha($newImage, 255, 255, 255, 127);
                imagefilledrectangle($newImage, 0, 0, $newWidth, $newHeight, $transparent);
            }

            // Resize
            imagecopyresampled(
                $newImage, $sourceImage,
                0, 0, 0, 0,
                $newWidth, $newHeight,
                $originalWidth, $originalHeight
            );

            // Generate new path with .webp extension
            $pathInfo = pathinfo($relativePath);
            $newRelativePath = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '.webp';
            $newFullPath = storage_path('app/public/' . $newRelativePath);

            // Ensure directory exists
            $dirPath = dirname($newFullPath);
            if (!is_dir($dirPath)) {
                mkdir($dirPath, 0755, true);
            }

            // Save as WebP
            $success = imagewebp($newImage, $newFullPath, $quality);

            // Free memory
            imagedestroy($sourceImage);
            imagedestroy($newImage);

            if ($success) {
                $newSize = filesize($newFullPath);
                $saved = $originalSize - $newSize;

                // Delete original if requested
                if ($deleteOriginals && $fullPath !== $newFullPath) {
                    unlink($fullPath);
                }

                $result['status'] = 'converted';
                $result['new_path'] = $newRelativePath;
                $result['saved'] = max(0, $saved);

                $savedPercent = round(($saved / $originalSize) * 100);
                $this->line("  ✅ {$relativePath} → {$newRelativePath} (saved {$savedPercent}%)");
            }

        } catch (\Exception $e) {
            $this->error("  ❌ Error converting {$relativePath}: " . $e->getMessage());
        }

        return $result;
    }

    /**
     * Create GD image resource from file
     */
    private function createImageResource($path, $mimeType)
    {
        switch ($mimeType) {
            case 'image/jpeg':
                return imagecreatefromjpeg($path);
            case 'image/png':
                return imagecreatefrompng($path);
            case 'image/gif':
                return imagecreatefromgif($path);
            default:
                return null;
        }
    }
}
