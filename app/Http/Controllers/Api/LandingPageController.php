<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LandingPage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;

class LandingPageController extends Controller
{
    /** Nomor WhatsApp default (format internasional tanpa +). */
    private const WA_NUMBER = '6281361364480';

    /* ===========================
     * Helpers umum
     * =========================== */

    /** Ambil string aman dari value (string/array['text']). */
    private function getTextOrArrayValue($value, string $key = 'text', string $default = ''): string
    {
        if (is_string($value)) return $value;
        if (is_array($value) && array_key_exists($key, $value) && is_string($value[$key])) return $value[$key];
        return $default;
    }

    /** Pastikan $parent[$key] menjadi array ['text'=>...] meski asalnya string/null. */
    private function ensureTextObject(array &$parent, string $key, string $fallbackText = ''): void
    {
        if (!array_key_exists($key, $parent)) {
            $parent[$key] = ['text' => $fallbackText];
            return;
        }
        if (is_string($parent[$key])) {
            $parent[$key] = ['text' => ($parent[$key] !== '' ? $parent[$key] : $fallbackText)];
            return;
        }
        if (is_array($parent[$key])) {
            if (!array_key_exists('text', $parent[$key]) || !is_string($parent[$key]['text']) || $parent[$key]['text'] === '') {
                $parent[$key]['text'] = $fallbackText;
            }
        } else {
            $parent[$key] = ['text' => $fallbackText];
        }
    }

    /** Pastikan path nested array tersedia. */
    private function ensureArrayPath(array &$root, array $path): void
    {
        $ref =& $root;
        foreach ($path as $segment) {
            if (!is_array($ref)) $ref = [];
            if (!array_key_exists($segment, $ref) || !is_array($ref[$segment])) $ref[$segment] = [];
            $ref =& $ref[$segment];
        }
    }

    /**
     * Deteksi URL placeholder/random.
     * Valid: images.unsplash.com/photo-..., images.pexels.com/...
     * Invalid: picsum.photos, via.placeholder.com, placehold.co, dummyimage.com, placeimg.com, source.unsplash.com (randomizer).
     */
    private function isPlaceholderImage($url): bool
    {
        if (!is_string($url) || $url === '') return true;
        $parts = @parse_url($url);
        $host = strtolower($parts['host'] ?? '');
        if ($host === '') return true;

        $alwaysRandom = [
            'picsum.photos',
            'via.placeholder.com',
            'placehold.co',
            'dummyimage.com',
            'placeimg.com',
            'source.unsplash.com',
        ];
        foreach ($alwaysRandom as $h) {
            if (str_contains($host, $h)) return true;
        }

        // images.unsplash.com/photo-… (fixed id) → valid
        if (str_contains($host, 'images.unsplash.com')) {
            $path = $parts['path'] ?? '';
            if (str_contains($path, '/photo-')) return false;
            return true; // unsplash images tanpa /photo- dianggap tidak spesifik
        }

        // pexels fixed ids → valid
        if (str_contains($host, 'images.pexels.com')) {
            return false;
        }

        // host lain: biarkan (AI diinstruksikan pakai dua host di atas)
        return false;
    }

    /** URL sederhana valid? (filter_var + bukan placeholder) */
    private function isLikelyValidUrl(string $url): bool
    {
        return (bool) filter_var($url, FILTER_VALIDATE_URL) && !$this->isPlaceholderImage($url);
    }

    /**
     * Bersihkan seluruh struktur dari URL placeholder/random.
     * Jika mendeteksi placeholder/random → kosongkan (tidak ada fallback).
     */
    private function sanitizeImagesRecursively(&$node, ?string $context = null): void
    {
        if (is_array($node)) {
            foreach ($node as $k => &$v) {
                if (in_array($k, ['image', 'backgroundImage', 'src', 'url'], true)) {
                    if (is_string($v) && $this->isPlaceholderImage($v)) {
                        $v = ''; // kosongkan agar tidak memakai gambar random
                    }
                } else {
                    $this->sanitizeImagesRecursively($v, is_string($k) ? $k : $context);
                }
            }
            unset($v);
        }
    }

    /* ===========================
     * Generate Landing Page via AI
     * =========================== */

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'store_name' => 'required|string|max:100',
            'store_description' => 'required|string|max:1000',
        ]);

        $user = $request->user();
        $storeName = $validated['store_name'];
        $storeDesc = $validated['store_description'];

        $prompt = $this->buildAiPrompt($storeName, $storeDesc);

        $apiKey = config('services.openai.key', env('OPENAI_API_KEY'));
        if (!$apiKey) {
            return response()->json(['message' => 'OpenAI API key missing'], 500);
        }

        $response = Http::withToken($apiKey)
            ->timeout((int) config('services.openai.timeout', 120))
            ->connectTimeout((int) config('services.openai.connect_timeout', 30))
            ->retry((int) config('services.openai.retries', 3), 20000)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'messages' => [
                    ['role' => 'system', 'content' => 'Anda adalah AI yang ahli membuat landing page. KELUARKAN HANYA satu objek JSON VALID.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => (float) config('services.openai.temperature', 0.4),
                'max_tokens' => (int) config('services.openai.max_tokens', 12000),
                'response_format' => ['type' => 'json_object']
            ]);

        if (!$response->ok()) {
            return response()->json(['message' => 'AI generation failed', 'details' => $response->json()], 502);
        }

        $content = $response->json('choices.0.message.content') ?? '';
        $json = json_decode($content, true);
        if (!is_array($json)) {
            return response()->json(['message' => 'AI returned invalid JSON'], 502);
        }

        // Pastikan struktur dasar & semua section tersedia
        $this->ensureRequiredSections($json, $storeName);

        // Paksa logo & favicon Wajib TEKS
        $lp =& $json['landingpage'];
        $lp['header']['logo']['text']  = $this->getTextOrArrayValue($lp['header']['logo'] ?? '', 'text', $this->generateLogoText($storeName));
        $lp['meta']['favicon']['text'] = $this->getTextOrArrayValue($lp['meta']['favicon'] ?? '', 'text', $this->generateFaviconText($storeName));

        // Bersihkan URL gambar placeholder/random (tanpa fallback)
        $this->sanitizeImagesRecursively($json);

        // Jika html/css dari AI kurang layak → buat UI fallback modern lengkap (semua section + form WA)
        $json = $this->ensurePrettyUiWithAllSections($json);

        // Simpan
        $landingPage = LandingPage::create([
            'user_id' => $user->id,
            'uuid' => (string) Str::uuid(),
            'slug' => Str::slug($storeName . '-' . Str::random(6)),
            'data' => $json,
        ]);

        return response()->json([
            'id' => $landingPage->id,
            'uuid' => $landingPage->uuid,
            'slug' => $landingPage->slug,
            'data' => $json,
            'message' => 'Landing page generated successfully'
        ]);
    }

    /* ===========================
     * Store / Update / Show / List
     * =========================== */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'data' => 'required|array',
        ]);

        $user = $request->user();
        $name = $validated['name'];
        $data = $validated['data'];

        // Generate slug from name
        $baseSlug = Str::slug($name);
        $slug = $this->generateUniqueSlug($baseSlug);

        // Create the landing page
        $landingPage = LandingPage::create([
            'user_id' => $user->id,
            'uuid' => (string) Str::uuid(),
            'slug' => $slug,
            'data' => $data,
        ]);

        return response()->json([
            'id' => $landingPage->id,
            'uuid' => $landingPage->uuid,
            'slug' => $landingPage->slug,
            'data' => $landingPage->data,
            'message' => 'Landing page created successfully'
        ]);
    }

    public function update(Request $request, LandingPage $landing)
    {
        $this->authorizeUserOwnership($request, $landing);
        $validated = $request->validate(['data' => 'required|array']);
        $landing->update(['data' => $validated['data']]);
        return response()->json(['success' => true, 'message' => 'Landing page updated successfully']);
    }

    public function updateByUuid(Request $request, string $uuid)
    {
        $landing = LandingPage::where('uuid', $uuid)->firstOrFail();
        return $this->update($request, $landing);
    }

    public function showById(Request $request, LandingPage $landing)
    {
        $this->authorizeUserOwnership($request, $landing);
        return response()->json($landing);
    }

    public function showBySlug(string $slug)
    {
        $landing = LandingPage::where('slug', $slug)->firstOrFail();
        
        // Jika request dari API (Accept: application/json), return JSON
        if (request()->wantsJson() || request()->header('Accept') === 'application/json') {
            return response()->json($landing);
        }
        
        // Jika request dari browser, return HTML
        $data = $landing->data;
        $html = $data['html'] ?? '';
        
        // Jika tidak ada HTML, generate HTML dari data
        if (empty($html)) {
            $json = ['landingpage' => $data, 'html' => '', 'css' => ''];
            $json = $this->ensurePrettyUiWithAllSections($json);
            $html = $json['html'];
        }
        
        return response($html)->header('Content-Type', 'text/html');
    }

    public function showByUuid(Request $request, string $uuid)
    {
        $landing = LandingPage::where('uuid', $uuid)->firstOrFail();
        
        // Jika request dari API (Accept: application/json), check ownership
        if (request()->wantsJson() || request()->header('Accept') === 'application/json') {
            $this->authorizeUserOwnership($request, $landing);
            return response()->json($landing);
        }
        
        // Jika request dari browser, return HTML tanpa check ownership (public view)
        $data = $landing->data;
        $html = $data['html'] ?? '';
        
        // Jika tidak ada HTML, generate HTML dari data
        if (empty($html)) {
            $json = ['landingpage' => $data, 'html' => '', 'css' => ''];
            $json = $this->ensurePrettyUiWithAllSections($json);
            $html = $json['html'];
        }
        
        return response($html)->header('Content-Type', 'text/html');
    }

    public function index(Request $request)
    {
        $items = LandingPage::where('user_id', $request->user()->id)
            ->orderByDesc('updated_at')
            ->get(['id', 'slug', 'data', 'updated_at', 'uuid']);
        return response()->json($items);
    }

    /* ===========================
     * Destroy / Duplicate
     * =========================== */

    public function destroy(Request $request, LandingPage $landing)
    {
        return $this->destroyLandingPage($request, $landing);
    }

    public function destroyByUuid(Request $request, string $uuid)
    {
        $landing = LandingPage::where('uuid', $uuid)->firstOrFail();
        return $this->destroyLandingPage($request, $landing);
    }

    private function destroyLandingPage(Request $request, LandingPage $landing)
    {
        $this->authorizeUserOwnership($request, $landing);
        $landing->delete();
        return response()->json(['success' => true, 'message' => 'Landing page berhasil dihapus']);
    }

    public function duplicate(Request $request, LandingPage $landing)
    {
        return $this->duplicateLandingPage($request, $landing);
    }

    public function duplicateByUuid(Request $request, string $uuid)
    {
        $landing = LandingPage::where('uuid', $uuid)->firstOrFail();
        return $this->duplicateLandingPage($request, $landing);
    }

    private function duplicateLandingPage(Request $request, LandingPage $landing)
    {
        $this->authorizeUserOwnership($request, $landing);
        $slug = $this->generateUniqueSlug($landing->slug . '-copy');

        $duplicate = LandingPage::create([
            'user_id' => $landing->user_id,
            'uuid' => (string) Str::uuid(),
            'slug' => $slug,
            'data' => $landing->data,
        ]);

        return response()->json([
            'id' => $duplicate->id,
            'uuid' => $duplicate->uuid,
            'slug' => $duplicate->slug,
            'data' => $duplicate->data,
            'message' => 'Landing page berhasil diduplicate'
        ]);
    }

    /* ===========================
     * Util auth, slug, prompt, UI, sections
     * =========================== */

    private function authorizeUserOwnership(Request $request, LandingPage $landing)
    {
        if ($request->user()->id !== $landing->user_id) {
            abort(403, 'Forbidden');
        }
    }

    private function generateUniqueSlug(string $baseSlug): string
    {
        $slug = $baseSlug;
        $i = 1;
        while (LandingPage::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . (++$i);
        }
        return $slug;
    }

    /** Prompt AI: Wajib gambar relevan sesuai deskripsi (kopi, donat, cafe, dll) & no-random. */
    private function buildAiPrompt(string $storeName, string $storeDesc): string
    {
        $logoText    = $this->generateLogoText($storeName);
        $faviconText = $this->generateFaviconText($storeName);
        $navLabels   = '"Beranda","Mengapa","Manfaat","Produk","Paket","Testimoni","Pemesanan","FAQ"';
        $uiGuidelines = 'UI modern: navbar sticky, hero full-bleed dgn overlay tipis, grid cards, rounded-2xl, shadow lembut, glassmorphism, animasi hover, form rapi, footer kontras. Aksesibilitas (alt/aria), semantic tags.';

        // Analisis deskripsi untuk menentukan kategori bisnis
        $businessCategory = $this->analyzeBusiness($storeDesc);
        $imageGuidelines = $this->getImageGuidelines($businessCategory);

        return
            "Buat 1 (satu) objek JSON landing page untuk bisnis berikut:\n" .
            "- Nama: {$storeName}\n" .
            "- Deskripsi: {$storeDesc}\n\n" .
            "WAJIB menyertakan SEMUA section: Header, Hero Section, Benefits Section, Product Overview, Package Options, Testimonials, CTA Section, FAQ Section.\n" .
            "WAJIB gunakan URL gambar nyata & SANGAT RELEVAN sesuai deskripsi bisnis:\n" .
            "{$imageGuidelines}\n" .
            "WAJIB host: images.unsplash.com/photo-... atau images.pexels.com/photos/...\n" .
            "DILARANG pakai placeholder/random: picsum.photos, via.placeholder.com, placehold.co, dummyimage.com, placeimg.com, source.unsplash.com.\n" .
            "Logo & favicon berupa TEKS pada field \"text\" (bukan URL).\n\n" .
            "Struktur JSON:\n" .
            "- landingpage: { meta, header, hero, benefits, product_overview, packages, testimonials, cta_order, faq, footer }\n" .
            "- html: HTML lengkap (UI modern sesuai \"{$uiGuidelines}\")\n" .
            "- css: CSS responsif (boleh inline di <style> pada html)\n\n" .
            "Header/meta contoh:\n" .
            "\"header\": { \"logo\": { \"text\": \"{$logoText}\", \"url\": \"#\" }, \"navigation\": [{$navLabels}] }\n" .
            "\"meta\": { \"title\": \"{$storeName}\", \"favicon\": { \"text\": \"{$faviconText}\" } }\n\n" .
            "Konten minimal:\n" .
            "- hero: \"headline\", \"subheadline\", \"backgroundImage\"(URL gambar hero yang SANGAT sesuai dengan bisnis)\n" .
            "- benefits: \"title\", \"items\" (≥3 item: title & description)\n" .
            "- product_overview: \"title\", \"content\", \"image\"(URL gambar produk yang SANGAT sesuai dengan bisnis)\n" .
            "- packages: \"title\", \"items\" (≥3: name, price, features[], cta)\n" .
            "- testimonials: \"title\", \"items\" (≥3: text, name, optional rating)\n" .
            "- cta_order: \"title\", \"subtitle\", \"form\" (fields minimal: name, phone, package)\n" .
            "- faq: \"title\", \"items\" (≥4: q, a)\n" .
            "- footer: \"text\", \"socials\" (array)\n\n" .
            "KELUARKAN HANYA 1 OBJEK JSON VALID (tanpa markdown, tanpa komentar).";
    }

    /** Analisis kategori bisnis berdasarkan deskripsi */
    private function analyzeBusiness(string $description): string
    {
        $desc = strtolower($description);
        
        if (preg_match('/\b(kopi|coffee|cafe|espresso|latte|cappuccino|barista)\b/', $desc)) {
            return 'coffee';
        }
        if (preg_match('/\b(donat|donut|roti|bakery|kue|pastry|bread)\b/', $desc)) {
            return 'bakery';
        }
        if (preg_match('/\b(restoran|restaurant|makanan|food|kuliner|masakan|menu)\b/', $desc)) {
            return 'restaurant';
        }
        if (preg_match('/\b(fashion|pakaian|baju|clothing|apparel|style)\b/', $desc)) {
            return 'fashion';
        }
        if (preg_match('/\b(teknologi|software|aplikasi|digital|IT|tech)\b/', $desc)) {
            return 'technology';
        }
        if (preg_match('/\b(kesehatan|health|medical|obat|farmasi)\b/', $desc)) {
            return 'health';
        }
        if (preg_match('/\b(pendidikan|education|kursus|training|belajar)\b/', $desc)) {
            return 'education';
        }
        if (preg_match('/\b(otomotif|mobil|motor|automotive|spare part)\b/', $desc)) {
            return 'automotive';
        }
        
        return 'general';
    }

    /** Panduan gambar berdasarkan kategori bisnis */
    private function getImageGuidelines(string $category): string
    {
        $guidelines = [
            'coffee' => 'Hero: foto coffee shop interior yang cozy, barista sedang membuat kopi, atau close-up espresso shot. Produk: foto latte art, berbagai jenis kopi, atau coffee beans.',
            'bakery' => 'Hero: foto bakery interior dengan display roti/kue, atau baker sedang bekerja. Produk: foto fresh bread, donut display, atau pastry yang menggugah selera.',
            'restaurant' => 'Hero: foto restaurant interior yang elegant, chef sedang memasak, atau food presentation. Produk: foto signature dish, food plating yang menarik, atau kitchen activity.',
            'fashion' => 'Hero: foto fashion store interior, model wearing clothes, atau fashion photoshoot. Produk: foto clothing collection, fashion accessories, atau lookbook style.',
            'technology' => 'Hero: foto modern office, people working with computers, atau tech workspace. Produk: foto gadgets, software interface, atau technology equipment.',
            'health' => 'Hero: foto medical facility, healthcare workers, atau wellness concept. Produk: foto medical equipment, health products, atau wellness activities.',
            'education' => 'Hero: foto classroom, students learning, atau educational environment. Produk: foto books, learning materials, atau educational activities.',
            'automotive' => 'Hero: foto car showroom, mechanic working, atau automotive workshop. Produk: foto cars, automotive parts, atau vehicle maintenance.',
            'general' => 'Hero: foto business environment yang professional dan modern. Produk: foto yang relevan dengan produk/layanan yang ditawarkan.'
        ];
        
        return $guidelines[$category] ?? $guidelines['general'];
    }

    private function generateLogoText(string $storeName): string
    {
        $clean = trim($storeName);
        if (strlen($clean) > 20) {
            $words = preg_split('/\s+/', $clean);
            if ($words && count($words) > 1) {
                $initials = '';
                foreach ($words as $w) { $initials .= strtoupper(substr($w, 0, 1)); }
                return $initials;
            }
            return strtoupper(substr($clean, 0, 8));
        }
        return $clean;
    }

    private function generateFaviconText(string $storeName): string
    {
        $words = preg_split('/\s+/', trim($storeName));
        return (is_array($words) && count($words) > 1)
            ? strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1))
            : strtoupper(substr($storeName, 0, 1));
    }

    /** Pastikan semua section wajib tersedia minimal dengan struktur dasar (edit-friendly). */
    private function ensureRequiredSections(array &$json, string $storeName): void
    {
        $this->ensureArrayPath($json, ['landingpage']);
        $lp =& $json['landingpage'];

        $this->ensureArrayPath($lp, ['meta']);
        $this->ensureArrayPath($lp, ['header']);
        $this->ensureArrayPath($lp, ['hero']);
        $this->ensureArrayPath($lp, ['benefits']);
        $this->ensureArrayPath($lp, ['product_overview']);
        $this->ensureArrayPath($lp, ['packages']);
        $this->ensureArrayPath($lp, ['testimonials']);
        $this->ensureArrayPath($lp, ['cta_order']);
        $this->ensureArrayPath($lp, ['faq']);
        $this->ensureArrayPath($lp, ['footer']);

        $lp['meta']['title'] = $this->getTextOrArrayValue($lp['meta']['title'] ?? '', 'text', $storeName);

        $this->ensureTextObject($lp['meta'], 'favicon', $this->generateFaviconText($storeName));
        $this->ensureTextObject($lp['header'], 'logo', $this->generateLogoText($storeName));

        if (!isset($lp['header']['navigation']) || !is_array($lp['header']['navigation'])) {
            $lp['header']['navigation'] = ['Beranda','Mengapa','Manfaat','Produk','Paket','Testimoni','Pemesanan','FAQ'];
        }

        if (!isset($lp['hero']['headline']) || !is_array($lp['hero']['headline'])) {
            $lp['hero']['headline'] = ['text' => $storeName];
        }
        if (!isset($lp['hero']['subheadline']) || !is_array($lp['hero']['subheadline'])) {
            $lp['hero']['subheadline'] = ['text' => 'Temukan pengalaman terbaik bersama kami.'];
        }
        if (!isset($lp['hero']['cta']) || !is_array($lp['hero']['cta'])) {
            $lp['hero']['cta'] = [
                'label' => ['text' => 'Pesan Sekarang'],
                'link' => ['text' => '#order']
            ];
        }
        if (!isset($lp['hero']['cta']['label']) || !is_array($lp['hero']['cta']['label'])) {
            $lp['hero']['cta']['label'] = ['text' => 'Pesan Sekarang'];
        }
        if (!isset($lp['hero']['cta']['link']) || !is_array($lp['hero']['cta']['link'])) {
            $lp['hero']['cta']['link'] = ['text' => '#order'];
        }

        if (!isset($lp['benefits']['title']) || !is_array($lp['benefits']['title'])) {
            $lp['benefits']['title'] = ['text' => 'Manfaat Utama'];
        }
        if (!isset($lp['benefits']['items']) || !is_array($lp['benefits']['items']) || count($lp['benefits']['items']) < 3) {
            $lp['benefits']['items'] = [
                ['title' => ['text' => 'Kualitas Terjamin'], 'description' => ['text' => 'Bahan terbaik & proses higienis.']],
                ['title' => ['text' => 'Harga Bersahabat'], 'description' => ['text' => 'Pilihan paket sesuai kebutuhan.']],
                ['title' => ['text' => 'Pelayanan Cepat'], 'description' => ['text' => 'Respon ramah & pengiriman tepat waktu.']],
            ];
        }

        if (!isset($lp['product_overview']['title']) || !is_array($lp['product_overview']['title'])) {
            $lp['product_overview']['title'] = ['text' => 'Produk & Layanan'];
        }
        if (!isset($lp['product_overview']['content']) || !is_array($lp['product_overview']['content'])) {
            $lp['product_overview']['content'] = ['text' => 'Rangkaian produk unggulan yang dirancang untuk kebutuhan Anda.'];
        }

        if (!isset($lp['packages']['title']) || !is_array($lp['packages']['title'])) {
            $lp['packages']['title'] = ['text' => 'Pilihan Paket'];
        }
        if (!isset($lp['packages']['items']) || !is_array($lp['packages']['items']) || count($lp['packages']['items']) < 3) {
            $lp['packages']['items'] = [
                ['name' => ['text' => 'Basic'], 'price' => ['text' => 'Rp 99.000'], 'features' => [['text' => 'Fitur A'],['text' => 'Fitur B'],['text' => 'Fitur C']], 'cta' => ['text' => 'Pilih Basic']],
                ['name' => ['text' => 'Standard'], 'price' => ['text' => 'Rp 199.000'], 'features' => [['text' => 'Fitur A'],['text' => 'Fitur B'],['text' => 'Fitur C'],['text' => 'Fitur D']], 'cta' => ['text' => 'Pilih Standard']],
                ['name' => ['text' => 'Premium'], 'price' => ['text' => 'Rp 399.000'], 'features' => [['text' => 'Semua Fitur'],['text' => 'Prioritas']], 'cta' => ['text' => 'Pilih Premium']],
            ];
        }

        if (!isset($lp['testimonials']['title']) || !is_array($lp['testimonials']['title'])) {
            $lp['testimonials']['title'] = ['text' => 'Apa Kata Mereka'];
        }
        if (!isset($lp['testimonials']['items']) || !is_array($lp['testimonials']['items']) || count($lp['testimonials']['items']) < 3) {
            $lp['testimonials']['items'] = [
                ['text' => ['text' => 'Layanannya memuaskan, produk sesuai ekspektasi!'], 'name' => ['text' => 'Rina']],
                ['text' => ['text' => 'Pengiriman cepat & kualitas top.'], 'name' => ['text' => 'Budi']],
                ['text' => ['text' => 'Harga bersahabat, akan repeat order.'], 'name' => ['text' => 'Andi']],
            ];
        }

        if (!isset($lp['cta_order']['title']) || !is_array($lp['cta_order']['title'])) {
            $lp['cta_order']['title'] = ['text' => 'Pesan Sekarang'];
        }
        if (!isset($lp['cta_order']['subtitle']) || !is_array($lp['cta_order']['subtitle'])) {
            $lp['cta_order']['subtitle'] = ['text' => 'Respon cepat via WhatsApp'];
        }
        if (!isset($lp['cta_order']['form']) || !is_array($lp['cta_order']['form'])) {
            $lp['cta_order']['form'] = ['fields' => [], 'submitText' => 'Kirim'];
        }

        if (!isset($lp['faq']['title']) || !is_array($lp['faq']['title'])) {
            $lp['faq']['title'] = ['text' => 'Pertanyaan yang Sering Diajukan'];
        }
        if (!isset($lp['faq']['items']) || !is_array($lp['faq']['items']) || count($lp['faq']['items']) < 4) {
            $lp['faq']['items'] = [
                ['q' => ['text' => 'Bagaimana cara pemesanan?'], 'a' => ['text' => 'Isi formulir pemesanan dan kami akan menghubungi Anda.']],
                ['q' => ['text' => 'Metode pembayaran?'], 'a' => ['text' => 'Transfer bank / e-wallet.']],
                ['q' => ['text' => 'Estimasi pengiriman?'], 'a' => ['text' => '1–3 hari kerja sesuai alamat.']],
                ['q' => ['text' => 'Apakah ada garansi?'], 'a' => ['text' => 'Ya, hubungi kami maksimal 2x24 jam.']],
            ];
        }

        if (!isset($lp['footer']['text']) || !is_array($lp['footer']['text'])) {
            $lp['footer']['text'] = ['text' => "© " . date('Y') . " {$storeName}. Semua hak dilindungi."];
        }
        if (!isset($lp['footer']['socials']) || !is_array($lp['footer']['socials'])) {
            $lp['footer']['socials'] = [
                ['name' => 'Instagram', 'url' => 'https://instagram.com/yourstore'],
                ['name' => 'WhatsApp', 'url' => 'https://wa.me/' . self::WA_NUMBER],
                ['name' => 'Facebook', 'url' => 'https://facebook.com/yourstore']
            ];
        }
    }

    /**
     * UI fallback modern & lengkap semua section jika html/css kurang layak.
     * Form WA khusus: Nama Lengkap, No. HP, Email, Produk, Lokasi → kirim ke wa.me/{WA_NUMBER}
     */
    private function ensurePrettyUiWithAllSections(array $json): array
    {
        $html = $json['html'] ?? '';
        $css  = $json['css']  ?? '';

        $badHtml = !is_string($html) || strlen(trim($html)) < 200 || str_contains($html, '<div>...</div>') || str_contains($html, '<section>...</section>');
        $badCss  = !is_string($css)  || strlen(trim($css))  < 50  || str_contains($css, '...');

        if (!$badHtml && !$badCss) return $json;

        $lp = $json['landingpage'] ?? [];

        $title  = $this->getTextOrArrayValue($lp['meta']['title'] ?? '', 'text', 'Landing Page');
        $logo   = $this->getTextOrArrayValue($lp['header']['logo'] ?? '', 'text', $title);
        $fav    = $this->getTextOrArrayValue($lp['meta']['favicon'] ?? '', 'text', strtoupper(substr($title, 0, 1)));

        $nav    = $lp['header']['navigation'] ?? ['Beranda','Mengapa','Manfaat','Produk','Paket','Testimoni','Pemesanan','FAQ'];

        $heroBgRaw = $lp['hero']['backgroundImage'] ?? '';
        $heroBg = (is_string($heroBgRaw) && $this->isLikelyValidUrl($heroBgRaw)) ? $heroBgRaw : '';
        $heroBgStyle = $heroBg ? "background: url('" . htmlspecialchars($heroBg) . "') center/cover no-repeat;" : "background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);";
        $heroH  = $this->getTextOrArrayValue($lp['hero']['headline'] ?? '', 'text', $title);
        $heroS  = $this->getTextOrArrayValue($lp['hero']['subheadline'] ?? '', 'text', 'Temukan pengalaman terbaik bersama kami.');
        $ctaL   = $this->getTextOrArrayValue($lp['hero']['cta']['label'] ?? '', 'text', 'Pesan Sekarang');
        $ctaH   = $this->getTextOrArrayValue($lp['hero']['cta']['link'] ?? '', 'text', '#order');

        $benefitsTitle = $this->getTextOrArrayValue($lp['benefits']['title'] ?? '', 'text', 'Manfaat Utama');
        $benefitsItems = $lp['benefits']['items'] ?? [];

        $productImgRaw = $lp['product_overview']['image'] ?? '';
        $productImg = is_string($productImgRaw) && $this->isLikelyValidUrl($productImgRaw) ? $productImgRaw : '';
        $productT   = $this->getTextOrArrayValue($lp['product_overview']['title'] ?? '', 'text', 'Produk & Layanan');
        $productC   = $this->getTextOrArrayValue($lp['product_overview']['content'] ?? '', 'text', 'Rangkaian produk unggulan yang dirancang untuk kebutuhan Anda.');

        $packagesTitle = $this->getTextOrArrayValue($lp['packages']['title'] ?? '', 'text', 'Pilihan Paket');
        $packagesItems = $lp['packages']['items'] ?? [];

        $tTitle = $this->getTextOrArrayValue($lp['testimonials']['title'] ?? '', 'text', 'Apa Kata Mereka');
        $tItems = $lp['testimonials']['items'] ?? [];

        $faqTitle = $this->getTextOrArrayValue($lp['faq']['title'] ?? '', 'text', 'Pertanyaan yang Sering Diajukan');
        $faqItems = $lp['faq']['items'] ?? [];

        $footerText = $this->getTextOrArrayValue($lp['footer']['text'] ?? '', 'text', "© " . date('Y') . " {$title}. Semua hak dilindungi.");
        $footerSocials = $lp['footer']['socials'] ?? ['Instagram','WhatsApp','Facebook'];

        $cssInline = <<<CSS
        /* --- Clean Light UI (not dark) --- */
        *{box-sizing:border-box}html,body{margin:0;padding:0}
        :root{
          --primary:#e76f51; /* accent */
          --text:#1f2937;    /* slate-800 */
          --muted:#64748b;   /* slate-500 */
          --line:#e9eef5;    /* subtle border */
          --card:#ffffff;    /* card bg */
          --page:#f7f9fc;    /* page bg (light tint) */
        }
        body{
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,system-ui,sans-serif;
          background:var(--page);
          color:var(--text);
          line-height:1.6;
        }
        .container{max-width:1200px;margin:0 auto;padding:0 20px}
        
        /* Header (white, floating) */
        header{
          position:sticky;top:0;z-index:50;
          background:#fff;
          border-bottom:1px solid var(--line);
          box-shadow:0 6px 18px rgba(16,24,40,.06);
        }
        nav{display:flex;align-items:center;justify-content:space-between;padding:16px 0}
        .logo{font-weight:800;letter-spacing:.5px;color:#e76f51;font-size:22px;text-transform:lowercase}
        .nav ul{display:flex;gap:22px;list-style:none;margin:0;padding:0}
        .nav a{text-decoration:none;color:#334155;font-weight:600}
        .nav a:hover{color:#111827}
        
        /* Hero (light overlay; content clickable) */
        .hero{
          position:relative;min-height:72vh;display:grid;place-items:center;
          background:#f1f5f9; /* fallback if no image */
        }
        .hero::after{
          content:'';position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(255,255,255,.60),rgba(255,255,255,.70));
          pointer-events:none; /* overlay tidak blok klik */
        }
        .hero-wrap{position:relative;z-index:1;text-align:center;max-width:900px;padding:56px 20px;pointer-events:auto}
        .badge{
          display:inline-block;padding:8px 14px;border-radius:999px;
          background:#fff;border:1px solid var(--line);color:#0f172a;font-weight:700;letter-spacing:.3px
        }
        .hero h1{font-size:48px;margin:18px 0 10px;line-height:1.15;color:#0f172a}
        .hero p{color:#475569;font-size:18px;margin-bottom:26px}
        .btn{
          display:inline-block;background:var(--primary);color:#fff;padding:14px 22px;border-radius:12px;
          font-weight:800;text-decoration:none;box-shadow:0 10px 24px rgba(231,111,81,.3);
          transition:transform .2s,box-shadow .2s
        }
        .btn:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(231,111,81,.38)}
        
        /* Sections (alternate background so it doesn't blend) */
        .section{padding:80px 0;background:transparent}
        .section:nth-of-type(even){background:#ffffff} /* selang-seling putih bersih */
        
        .section h2{font-size:32px;margin:0 0 8px}
        .muted{color:var(--muted)}
        
        /* Cards & grids (cards = white, clear separation) */
        .cards{display:grid;gap:22px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
        .card{
          background:var(--card);
          border:1px solid var(--line);
          border-radius:16px;
          padding:22px;
          box-shadow:0 10px 24px rgba(16,24,40,.06);
        }
        .card h3{margin:0 0 6px}
        
        /* Product split */
        .product{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:28px;align-items:center}
        .product img{
          width:100%;border-radius:16px;border:1px solid var(--line);
          box-shadow:0 16px 36px rgba(16,24,40,.10);background:#fff
        }
        
        /* Pricing cards */
        .pricing{display:grid;gap:22px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
        .price{
          background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px;
          box-shadow:0 16px 34px rgba(16,24,40,.08)
        }
        .price .tag{font-weight:900;font-size:28px;color:#0f172a;margin:8px 0}
        .price ul{list-style:none;margin:0 0 16px 0;padding:0}
        
                /* --- Order Form (clean & modern) --- */
        .form-wrap{max-width:720px;margin:0 auto}
        .form-card{
        background:#fff;border:1px solid var(--line);border-radius:18px;
        box-shadow:0 16px 34px rgba(16,24,40,.08);padding:28px
        }
        .form-grid{display:flex;flex-direction:column;gap:16px}
        .field{display:flex;flex-direction:column;gap:6px}
        .field label{font-weight:700;color:#0f172a}
        .input,.select,textarea{
        border:1px solid var(--line);border-radius:12px;padding:12px 14px;
        background:#fff;color:#0f172a;outline:none;transition:box-shadow .2s,border-color .2s;width:100%
        }
        .input:focus,.select:focus,textarea:focus{border-color:#cbd5e1;box-shadow:0 0 0 4px #eff6ff}
        .helper{font-size:12px;color:#ef4444}
        .form-actions{display:flex;justify-content:center;margin-top:10px}
        .btn-wa{display:inline-flex;align-items:center;gap:10px}
        .btn-wa svg{width:18px;height:18px;fill:#fff}


        /* FAQ */
        .faq{max-width:900px;margin:0 auto}
        .faq-item{
          background:var(--card);border:1px solid var(--line);
          border-radius:14px;padding:16px;margin-bottom:12px;
          box-shadow:0 8px 22px rgba(16,24,40,.06)
        }
        
        /* Footer (light) */
        footer{
          background:#fff;color:#64748b;
          border-top:1px solid var(--line);
          padding:28px 0;margin-top:40px
        }
        .footer-content{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}
        .footer-socials{display:flex;gap:16px;align-items:center}
        CSS;
        

        $navHtml = '';
        foreach ($nav as $n) {
            $slug = '#'.strtolower(str_replace(' ', '-', (string)$n));
            $navHtml .= '<li><a href="'.$slug.'">'.htmlspecialchars((string)$n).'</a></li>';
        }

        // Benefits dengan ikon
        $benefitsGrid = '';
        $benefitIcons = ['🏆', '💰', '⚡', '🎯', '✨', '🔥']; // ikon default
        foreach ($benefitsItems as $index => $b) {
            $bt = htmlspecialchars($this->getTextOrArrayValue($b['title'] ?? '', 'text', 'Keunggulan'));
            $bd = htmlspecialchars($this->getTextOrArrayValue($b['description'] ?? '', 'text', 'Deskripsi singkat'));
            $icon = $benefitIcons[$index % count($benefitIcons)];
            $benefitsGrid .= '<div class="card"><div style="font-size:32px;margin-bottom:12px">'.$icon.'</div><h3>'.$bt.'</h3><p class="muted">'.$bd.'</p></div>';
        }

        // Packages
        $packagesGrid = '';
        foreach ($packagesItems as $p) {
            $pn = htmlspecialchars($this->getTextOrArrayValue($p['name'] ?? '', 'text', 'Paket'));
            $pp = htmlspecialchars($this->getTextOrArrayValue($p['price'] ?? '', 'text', 'Hubungi kami'));
            $pf = $p['features'] ?? [];
            $pfHtml = '';
            if (is_array($pf)) {
                foreach ($pf as $f) {
                    $pfText = $this->getTextOrArrayValue($f, 'text', 'Fitur');
                    $pfHtml .= '<li>'.htmlspecialchars($pfText).'</li>';
                }
            }
            $pc = htmlspecialchars($this->getTextOrArrayValue($p['cta'] ?? '', 'text', 'Pilih Paket'));
            $packagesGrid .= '<div class="price"><h3>'.$pn.'</h3><div class="tag">'.$pp.'</div><ul>'.$pfHtml.'</ul><a class="btn" href="#order">'.$pc.'</a></div>';
        }

        // Testimonials dengan avatar
        $tGrid = '';
        $avatarUrls = [
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
        ];
        foreach ($tItems as $index => $t) {
            $tt = htmlspecialchars($this->getTextOrArrayValue($t['text'] ?? '', 'text', 'Sangat puas!'));
            $tn = htmlspecialchars($this->getTextOrArrayValue($t['name'] ?? '', 'text', 'Pelanggan'));
            $avatar = $avatarUrls[$index % count($avatarUrls)];
            $tGrid .= '<div class="card"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><img src="'.$avatar.'" alt="'.$tn.'" style="width:48px;height:48px;border-radius:50%;object-fit:cover"><strong>'.$tn.'</strong></div><p>"'.$tt.'"</p></div>';
        }

        // FAQ
        $faqList = '';
        foreach ($faqItems as $fq) {
            $q = htmlspecialchars($this->getTextOrArrayValue($fq['q'] ?? '', 'text', 'Pertanyaan?'));
            $a = htmlspecialchars($this->getTextOrArrayValue($fq['a'] ?? '', 'text', 'Jawaban.'));
            $faqList .= '<div class="faq-item"><strong>'.$q.'</strong><p class="muted">'.$a.'</p></div>';
        }

        // Product image (tetap kosong jika tak valid dari AI)
        $productImageHtml = $productImg
            ? '<img src="'.htmlspecialchars($productImg).'" alt="Produk unggulan">'
            : '<div style="width:100%;height:320px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:grid;place-items:center;color:#fff;font-size:18px;font-weight:600;">Tambahkan gambar produk yang relevan di generator AI</div>';

$prettyHtml = <<<HTML
<!doctype html><html lang="id"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{$fav} {$title}</title>
<style>{$cssInline}</style>
</head><body>

<header>
  <div class="container">
    <nav>
      <div class="logo">{$logo}</div>
      <div class="nav"><ul>{$navHtml}</ul></div>
    </nav>
  </div>
</header>

<section class="hero" id="beranda" style="{$heroBgStyle}">
  <div class="hero-wrap">
    <span class="badge">{$title}</span>
    <h1>{$heroH}</h1>
    <p>{$heroS}</p>
    <a class="btn" href="{$ctaH}">{$ctaL}</a>
  </div>
</section>

<section class="section" id="manfaat">
  <div class="container">
    <h2>{$benefitsTitle}</h2>
    <div class="cards">{$benefitsGrid}</div>
  </div>
</section>

<section class="section" id="produk">
  <div class="container product">
    <div>
      <h2>{$productT}</h2>
      <p class="muted">{$productC}</p>
      <a class="btn" href="#order">Pesan via WhatsApp</a>
    </div>
    {$productImageHtml}
  </div>
</section>

<section class="section" id="paket">
  <div class="container">
    <h2>{$packagesTitle}</h2>
    <div class="pricing">{$packagesGrid}</div>
  </div>
</section>

<section class="section" id="testimoni">
  <div class="container">
    <h2>{$tTitle}</h2>
    <div class="cards">{$tGrid}</div>
  </div>
</section>

<section class="section" id="order">
  <div class="container">
    <h2 class="form-title" style="font-size:32px;margin:0 0 8px;color:#0f172a">Form Pemesanan</h2>
    <p class="form-subtitle" style="color:#64748b;margin:0 0 18px">Isi data di bawah ini dengan lengkap dan benar</p>

    <div class="form-wrap" style="max-width:600px;margin:0 auto">
      <div class="form-card" style="background:#fff;border:1px solid #e9eef5;border-radius:18px;box-shadow:0 16px 34px rgba(16,24,40,.08);padding:28px">
        <form id="waForm" class="form-grid" novalidate>
          
          <!-- Nama -->
          <div class="field" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
            <label for="ord-fullname" style="font-weight:700;color:#0f172a">Nama Lengkap</label>
            <input id="ord-fullname" type="text" name="full_name" placeholder="Masukkan nama Anda" required
                   style="border:1px solid #e9eef5;border-radius:12px;padding:12px 14px;color:#0f172a;outline:none"/>
          </div>

          <!-- Telepon -->
          <div class="field" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
            <label for="ord-phone" style="font-weight:700;color:#0f172a">Nomor Telepon</label>
            <input id="ord-phone" type="tel" name="phone" placeholder="Masukkan nomor telepon" required
                   style="border:1px solid #e9eef5;border-radius:12px;padding:12px 14px;color:#0f172a;outline:none"/>
            <small style="color:#ef4444;font-size:12px;margin-top:2px;display:block">
              *pastikan nomor HP benar untuk dihubungi via WhatsApp
            </small>
          </div>

          <!-- Email -->
          <div class="field" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
            <label for="ord-email" style="font-weight:700;color:#0f172a">Email</label>
            <input id="ord-email" type="email" name="email" placeholder="Masukkan email Anda"
                   style="border:1px solid #e9eef5;border-radius:12px;padding:12px 14px;color:#0f172a;outline:none"/>
          </div>

          <!-- Paket -->
          <div class="field" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
            <label for="ord-package" style="font-weight:700;color:#0f172a">Pilih Paket</label>
            <select id="ord-package" name="package" required
                    style="border:1px solid #e9eef5;border-radius:12px;padding:12px 14px;color:#0f172a;outline:none">
              <option value="">-- Pilih Paket --</option>
            </select>
          </div>

          <!-- Tombol -->
          <div style="display:flex;justify-content:center">
            <button type="submit"
                    style="display:inline-flex;align-items:center;gap:10px;background:#25D366;color:#fff;padding:16px 28px;border:none;border-radius:12px;font-weight:800;box-shadow:0 10px 24px rgba(37,211,102,.3);cursor:pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"/>
              </svg>
              Pesan via WhatsApp
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</section>




<section class="section" id="faq">
  <div class="container">
    <h2>{$faqTitle}</h2>
    <div class="faq">{$faqList}</div>
  </div>
</section>

<footer>
  <div class="container">
    <div class="footer-content">
      <p>{$footerText}</p>
      <div class="footer-socials">
        <span class="muted">Sosial:</span>
        __SOCIALS__
      </div>
    </div>
  </div>
</footer>

<script>
// Form WhatsApp handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('waForm');
    const packageSelect = document.getElementById('ord-package');
    
    // Populate package options from pricing section
    const packages = document.querySelectorAll('.price h3');
    packages.forEach(pkg => {
        const option = document.createElement('option');
        option.value = pkg.textContent;
        option.textContent = pkg.textContent;
        packageSelect.appendChild(option);
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const fullName = formData.get('full_name') || '';
        const phone = formData.get('phone') || '';
        const email = formData.get('email') || '';
        const packageName = formData.get('package') || '';
        const storeName = '{$title}';
        
        if (!fullName || !phone || !packageName) {
            alert('Mohon lengkapi data yang wajib diisi (Nama, No. HP, dan Paket)');
            return;
        }
        
        const message = `Siang Min, Saya \${fullName} ingin memesan produk dari \${storeName}:\n\nNama Lengkap: \${fullName}\nNo. HP: \${phone}\nEmail: \${email}\nProduk: \${packageName}\n\nTerima kasih 🙏`;
        
        const waUrl = `https://wa.me/" . self::WA_NUMBER . "?text=\${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    });
});
</script>
</body></html>
HTML;

        // render socials dengan ikon
        $socialsText = '';
        if (is_array($footerSocials)) {
            $socialIcons = [
                'whatsapp' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"/></svg>',
                'instagram' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
                'facebook' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
                'tiktok' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="#000000"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>'
            ];
            
            $socialLinks = [];
            foreach ($footerSocials as $social) {
                if (is_array($social)) {
                    if (isset($social['name']) && isset($social['url'])) {
                        $name = strtolower((string)$social['name']);
                        $icon = $socialIcons[$name] ?? '<span style="color:#64748b">' . htmlspecialchars((string)$social['name']) . '</span>';
                        $socialLinks[] = '<a href="' . htmlspecialchars((string)$social['url']) . '" target="_blank" style="display:inline-flex;align-items:center;text-decoration:none;margin:0 8px;">' . $icon . '</a>';
                    } elseif (isset($social['text'])) {
                        $socialLinks[] = htmlspecialchars((string)$social['text']);
                    }
                } elseif (is_string($social)) {
                    $name = strtolower($social);
                    $icon = $socialIcons[$name] ?? '<span style="color:#64748b">' . htmlspecialchars($social) . '</span>';
                    $socialLinks[] = $icon;
                }
            }
            $socialsText = implode(' ', $socialLinks);
        }
        $prettyHtmlCombined = str_replace('__SOCIALS__', $socialsText, $prettyHtml);

        $json['html'] = $prettyHtmlCombined;
        $json['css']  = ''; // CSS inline
        return $json;
    }

    /** Encode string PHP jadi literal JS aman (dengan quotes). */
    private function jsonEncodeJs(string $value): string
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /** Escape angka untuk disisipkan ke URL/JS tanpa karakter non-digit. */
    private function escapeForJs(string $value): string
    {
        return preg_replace('/[^0-9]/', '', $value);
    }
}
