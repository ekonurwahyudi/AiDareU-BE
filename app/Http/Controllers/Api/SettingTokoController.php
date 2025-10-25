<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SettingToko;
use App\Models\SlideToko;
use App\Models\FaqToko;
use App\Models\TestimoniToko;
use App\Models\SeoToko;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class SettingTokoController extends Controller
{
    // Get store data by subdomain with all theme settings and products
    public function getStoreBySubdomain($subdomain)
    {
        try {
            // Find store by subdomain
            $store = Store::where('subdomain', $subdomain)->first();

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            $storeUuid = $store->uuid;

            // Get theme settings
            $settings = SettingToko::where('uuid_store', $storeUuid)->first();
            $slideData = SlideToko::where('uuid_store', $storeUuid)->first();

            // Convert slides to array format for frontend
            $slides = [];
            if ($slideData) {
                if ($slideData->slide_1) {
                    $slides[] = [
                        'id' => 1,
                        'gambar_slide' => url('storage/' . $slideData->slide_1),
                        'image' => url('storage/' . $slideData->slide_1)
                    ];
                }
                if ($slideData->slide_2) {
                    $slides[] = [
                        'id' => 2,
                        'gambar_slide' => url('storage/' . $slideData->slide_2),
                        'image' => url('storage/' . $slideData->slide_2)
                    ];
                }
                if ($slideData->slide_3) {
                    $slides[] = [
                        'id' => 3,
                        'gambar_slide' => url('storage/' . $slideData->slide_3),
                        'image' => url('storage/' . $slideData->slide_3)
                    ];
                }
            }

            $faqs = FaqToko::where('uuid_store', $storeUuid)->ordered()->get();
            $testimonials = TestimoniToko::where('uuid_store', $storeUuid)->get();
            $seo = SeoToko::where('uuid_store', $storeUuid)->first();

            // Get products
            $products = \App\Models\Product::where('uuid_store', $storeUuid)
                ->where('status_produk', 'active')
                ->get()
                ->map(function ($product) {
                    // Get first image from upload_gambar_produk (already JSON/array)
                    $images = $product->upload_gambar_produk;
                    $firstImage = null;

                    if (is_string($images)) {
                        $images = json_decode($images, true);
                    }

                    if (is_array($images) && count($images) > 0) {
                        $firstImage = $images[0];
                    }

                    return [
                        'id' => $product->id,
                        'uuid' => $product->uuid,
                        'name' => $product->nama_produk,
                        'slug' => $product->slug,
                        'brand' => null,
                        'price' => (float) $product->harga_produk,
                        'salePrice' => $product->harga_diskon ? (float) $product->harga_diskon : null,
                        'rating' => 4.9,
                        'reviews' => 0,
                        'image' => $firstImage ? url('storage/' . $firstImage) : '/placeholder.jpg',
                        'isNew' => $product->created_at->diffInDays(now()) <= 30,
                        'inStock' => ($product->stock ?? 0) > 0,
                        'storeUuid' => $product->uuid_store,
                        'jenis_produk' => $product->jenis_produk ?? 'fisik'
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'store' => [
                        'uuid' => $store->uuid,
                        'name' => $store->name,
                        'subdomain' => $store->subdomain,
                        'logo' => $store->logo,
                        'description' => $store->description ?? null,
                    ],
                    'settings' => $settings,
                    'slides' => $slides,
                    'faqs' => $faqs,
                    'testimonials' => $testimonials,
                    'seo' => $seo,
                    'products' => $products,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching store data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get all theme settings for a store
    public function index(Request $request)
    {
        try {
            $storeUuid = $request->query('store_uuid');

            if (!$storeUuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store UUID is required'
                ], 400);
            }

            $store = Store::where('uuid', $storeUuid)->first();
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            $settings = SettingToko::where('uuid_store', $storeUuid)->first();
            $slides = SlideToko::where('uuid_store', $storeUuid)->first();
            $faqs = FaqToko::where('uuid_store', $storeUuid)->ordered()->get();
            $testimonials = TestimoniToko::where('uuid_store', $storeUuid)->get();
            $seo = SeoToko::where('uuid_store', $storeUuid)->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'settings' => $settings,
                    'slides' => $slides,
                    'faqs' => $faqs,
                    'testimonials' => $testimonials,
                    'seo' => $seo,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching theme settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update general settings
    public function updateGeneral(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|exists:stores,uuid',
                'site_title' => 'nullable|string|max:255',
                'site_tagline' => 'nullable|string|max:255',
                'primary_color' => 'nullable|string|max:7',
                'logo' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
                'favicon' => 'nullable|image|mimes:jpeg,jpg,png,gif,ico|max:512',
                'delete_logo' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->only(['uuid_store', 'site_title', 'site_tagline', 'primary_color']);

            // Get existing settings
            $existingSettings = SettingToko::where('uuid_store', $request->uuid_store)->first();

            // Handle logo deletion
            if ($request->input('delete_logo') === 'true') {
                if ($existingSettings && $existingSettings->logo) {
                    // Delete old logo file
                    Storage::disk('public')->delete($existingSettings->logo);
                }
                $data['logo'] = null;
            }
            // Handle logo upload
            elseif ($request->hasFile('logo')) {
                // Delete old logo if exists
                if ($existingSettings && $existingSettings->logo) {
                    Storage::disk('public')->delete($existingSettings->logo);
                }

                $logo = $request->file('logo');
                $logoPath = $logo->store('theme/logos', 'public');
                $data['logo'] = $logoPath;
            }

            // Handle favicon upload
            if ($request->hasFile('favicon')) {
                // Delete old favicon if exists
                if ($existingSettings && $existingSettings->favicon) {
                    Storage::disk('public')->delete($existingSettings->favicon);
                }

                $favicon = $request->file('favicon');
                $faviconPath = $favicon->store('theme/favicons', 'public');
                $data['favicon'] = $faviconPath;
            }

            $settings = SettingToko::updateOrCreate(
                ['uuid_store' => $request->uuid_store],
                $data
            );

            return response()->json([
                'success' => true,
                'message' => 'General settings updated successfully',
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating general settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update slides
    public function updateSlides(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|exists:stores,uuid',
                'slide_1' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
                'slide_2' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
                'slide_3' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = ['uuid_store' => $request->uuid_store];

            // Handle slide uploads
            for ($i = 1; $i <= 3; $i++) {
                if ($request->hasFile("slide_$i")) {
                    $slide = $request->file("slide_$i");
                    $slidePath = $slide->store('theme/slides', 'public');
                    $data["slide_$i"] = $slidePath;
                }
            }

            $slides = SlideToko::updateOrCreate(
                ['uuid_store' => $request->uuid_store],
                $data
            );

            return response()->json([
                'success' => true,
                'message' => 'Slides updated successfully',
                'data' => $slides
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating slides',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // FAQ CRUD
    public function createFaq(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|exists:stores,uuid',
                'pertanyaan' => 'required|string',
                'jawaban' => 'required|string',
                'urutan' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $faq = FaqToko::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'FAQ created successfully',
                'data' => $faq
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating FAQ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateFaq(Request $request, $uuid)
    {
        try {
            $faq = FaqToko::where('uuid', $uuid)->first();
            if (!$faq) {
                return response()->json([
                    'success' => false,
                    'message' => 'FAQ not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'pertanyaan' => 'required|string',
                'jawaban' => 'required|string',
                'urutan' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $faq->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'FAQ updated successfully',
                'data' => $faq
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating FAQ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteFaq($uuid)
    {
        try {
            $faq = FaqToko::where('uuid', $uuid)->first();
            if (!$faq) {
                return response()->json([
                    'success' => false,
                    'message' => 'FAQ not found'
                ], 404);
            }

            $faq->delete();

            return response()->json([
                'success' => true,
                'message' => 'FAQ deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting FAQ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Testimonial CRUD
    public function createTestimonial(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|exists:stores,uuid',
                'nama' => 'required|string',
                'testimoni' => 'required|string',
                'rating' => 'required|integer|min:1|max:5',
                'lokasi' => 'nullable|string',
                'paket' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $testimonial = TestimoniToko::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Testimonial created successfully',
                'data' => $testimonial
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating testimonial',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateTestimonial(Request $request, $uuid)
    {
        try {
            $testimonial = TestimoniToko::where('uuid', $uuid)->first();
            if (!$testimonial) {
                return response()->json([
                    'success' => false,
                    'message' => 'Testimonial not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nama' => 'required|string',
                'testimoni' => 'required|string',
                'rating' => 'required|integer|min:1|max:5',
                'lokasi' => 'nullable|string',
                'paket' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $testimonial->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Testimonial updated successfully',
                'data' => $testimonial
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating testimonial',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteTestimonial($uuid)
    {
        try {
            $testimonial = TestimoniToko::where('uuid', $uuid)->first();
            if (!$testimonial) {
                return response()->json([
                    'success' => false,
                    'message' => 'Testimonial not found'
                ], 404);
            }

            $testimonial->delete();

            return response()->json([
                'success' => true,
                'message' => 'Testimonial deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting testimonial',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update SEO settings
    public function updateSeo(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|exists:stores,uuid',
                'meta_title' => 'nullable|string|max:255',
                'deskripsi' => 'nullable|string',
                'keyword' => 'nullable|string',
                'og_title' => 'nullable|string|max:255',
                'og_deskripsi' => 'nullable|string',
                'og_image' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->only(['uuid_store', 'meta_title', 'deskripsi', 'keyword', 'og_title', 'og_deskripsi']);

            // Handle OG image upload
            if ($request->hasFile('og_image')) {
                $ogImage = $request->file('og_image');
                $ogImagePath = $ogImage->store('theme/seo', 'public');
                $data['og_image'] = $ogImagePath;
            }

            $seo = SeoToko::updateOrCreate(
                ['uuid_store' => $request->uuid_store],
                $data
            );

            return response()->json([
                'success' => true,
                'message' => 'SEO settings updated successfully',
                'data' => $seo
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating SEO settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
