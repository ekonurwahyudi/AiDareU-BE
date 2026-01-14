<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Platformpreneur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class PlatformManagementController extends Controller
{
    private const UUID_PATTERN = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
    private const ALLOWED_DOCUMENT_MIMES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    private const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/jpg'];

    private function isValidUuid(string $uuid): bool
    {
        return preg_match(self::UUID_PATTERN, $uuid) === 1;
    }

    private function sanitizeInput(?string $value): ?string
    {
        return $value === null ? null : trim(strip_tags($value));
    }

    private function verifyFileMimeType($file, array $allowedMimes): bool
    {
        return in_array($file->getMimeType(), $allowedMimes);
    }

    public function index(Request $request)
    {
        try {
            $perPage = min((int) $request->get('per_page', 10), 100);
            $search = $this->sanitizeInput($request->get('search'));
            $query = Platformpreneur::query();

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('no_kontrak', 'ilike', "%{$search}%")
                      ->orWhere('judul', 'ilike', "%{$search}%")
                      ->orWhere('perusahaan', 'ilike', "%{$search}%")
                      ->orWhere('domain', 'ilike', "%{$search}%")
                      ->orWhere('nama', 'ilike', "%{$search}%")
                      ->orWhere('email', 'ilike', "%{$search}%");
                });
            }

            $platforms = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Add sisa_kuota calculation for each platform
            foreach ($platforms as $platform) {
                $usedQuota = \App\Models\User::where('info_dari', $platform->username)->count();
                $platform->sisa_kuota = $platform->kuota_user - $usedQuota;
            }

            Log::info('Platform list accessed', ['user_id' => Auth::id(), 'search' => $search, 'total' => $platforms->total()]);

            return response()->json(['status' => 'success', 'data' => $platforms]);
        } catch (\Exception $e) {
            Log::error('Failed to get platforms: ' . $e->getMessage(), ['user_id' => Auth::id()]);
            return response()->json(['status' => 'error', 'message' => 'Gagal mengambil data platform.'], 500);
        }
    }

    public function show($uuid)
    {
        if (!$this->isValidUuid($uuid)) {
            return response()->json(['status' => 'error', 'message' => 'Format UUID tidak valid.'], 400);
        }

        try {
            $platform = Platformpreneur::where('uuid', $uuid)->first();
            if (!$platform) {
                return response()->json(['status' => 'error', 'message' => 'Platform tidak ditemukan.'], 404);
            }

            Log::info('Platform detail accessed', ['user_id' => Auth::id(), 'platform_uuid' => $uuid]);
            return response()->json(['status' => 'success', 'data' => $platform]);
        } catch (\Exception $e) {
            Log::error('Failed to get platform: ' . $e->getMessage(), ['user_id' => Auth::id(), 'uuid' => $uuid]);
            return response()->json(['status' => 'error', 'message' => 'Gagal mengambil data platform.'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'no_kontrak' => 'required|string|max:100|unique:platformpreneur,no_kontrak',
                'judul' => 'required|string|max:255',
                'username' => 'required|string|max:100|unique:platformpreneur,username',
                'perusahaan' => 'required|string|max:255',
                'file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
                'nama' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'no_hp' => 'required|string|max:20',
                'lokasi' => 'required|string|max:255',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'logo_footer' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'coin_user' => 'required|integer|min:0|max:999999999',
                'kuota_user' => 'required|integer|min:0|max:999999999',
                'domain' => 'required|string|max:255|unique:platformpreneur,domain',
                'cart' => 'nullable|boolean',
                'tgl_mulai' => 'required|date',
                'tgl_akhir' => 'required|date|after:tgl_mulai'
            ]);

            if ($validator->fails()) {
                return response()->json(['status' => 'error', 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);
            }

            // Verify actual MIME types
            if ($request->hasFile('file') && !$this->verifyFileMimeType($request->file('file'), self::ALLOWED_DOCUMENT_MIMES)) {
                return response()->json(['status' => 'error', 'message' => 'Tipe file dokumen tidak valid.'], 422);
            }
            if ($request->hasFile('logo') && !$this->verifyFileMimeType($request->file('logo'), self::ALLOWED_IMAGE_MIMES)) {
                return response()->json(['status' => 'error', 'message' => 'Tipe file logo tidak valid.'], 422);
            }
            if ($request->hasFile('logo_footer') && !$this->verifyFileMimeType($request->file('logo_footer'), self::ALLOWED_IMAGE_MIMES)) {
                return response()->json(['status' => 'error', 'message' => 'Tipe file logo footer tidak valid.'], 422);
            }

            $platformData = [
                'no_kontrak' => $this->sanitizeInput($request->input('no_kontrak')),
                'judul' => $this->sanitizeInput($request->input('judul')),
                'username' => $this->sanitizeInput($request->input('username')),
                'perusahaan' => $this->sanitizeInput($request->input('perusahaan')),
                'nama' => $this->sanitizeInput($request->input('nama')),
                'email' => $this->sanitizeInput($request->input('email')),
                'no_hp' => $this->sanitizeInput($request->input('no_hp')),
                'lokasi' => $this->sanitizeInput($request->input('lokasi')),
                'coin_user' => (int) $request->input('coin_user'),
                'kuota_user' => (int) $request->input('kuota_user'),
                'domain' => $this->sanitizeInput($request->input('domain')),
                'cart' => $request->input('cart', false),
                'tgl_mulai' => $request->input('tgl_mulai'),
                'tgl_akhir' => $request->input('tgl_akhir')
            ];

            $platform = Platformpreneur::create($platformData);

            if ($request->hasFile('file')) {
                $platform->file = $request->file('file')->store('platforms/' . $platform->uuid . '/documents', 'public');
            }
            if ($request->hasFile('logo')) {
                $platform->logo = $request->file('logo')->store('platforms/' . $platform->uuid . '/logos', 'public');
            }
            if ($request->hasFile('logo_footer')) {
                $platform->logo_footer = $request->file('logo_footer')->store('platforms/' . $platform->uuid . '/logos', 'public');
            }
            $platform->save();

            Log::info('Platform created', ['user_id' => Auth::id(), 'platform_uuid' => $platform->uuid, 'name' => $platform->judul]);

            return response()->json(['status' => 'success', 'message' => 'Platform berhasil dibuat.', 'data' => $platform], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create platform: ' . $e->getMessage(), ['user_id' => Auth::id()]);
            return response()->json(['status' => 'error', 'message' => 'Gagal membuat platform.'], 500);
        }
    }


    public function update(Request $request, $uuid)
    {
        if (!$this->isValidUuid($uuid)) {
            return response()->json(['status' => 'error', 'message' => 'Format UUID tidak valid.'], 400);
        }

        try {
            $platform = Platformpreneur::where('uuid', $uuid)->first();
            if (!$platform) {
                return response()->json(['status' => 'error', 'message' => 'Platform tidak ditemukan.'], 404);
            }

            $validator = Validator::make($request->all(), [
                'no_kontrak' => 'sometimes|required|string|max:100|unique:platformpreneur,no_kontrak,' . $platform->id,
                'judul' => 'sometimes|required|string|max:255',
                'username' => 'sometimes|required|string|max:100|unique:platformpreneur,username,' . $platform->id,
                'perusahaan' => 'sometimes|required|string|max:255',
                'file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
                'nama' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|max:255',
                'no_hp' => 'sometimes|required|string|max:20',
                'lokasi' => 'sometimes|required|string|max:255',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'logo_footer' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'coin_user' => 'sometimes|required|integer|min:0|max:999999999',
                'kuota_user' => 'sometimes|required|integer|min:0|max:999999999',
                'domain' => 'sometimes|required|string|max:255|unique:platformpreneur,domain,' . $platform->id,
                'cart' => 'nullable|boolean',
                'tgl_mulai' => 'sometimes|required|date',
                'tgl_akhir' => 'sometimes|required|date|after:tgl_mulai'
            ]);

            if ($validator->fails()) {
                return response()->json(['status' => 'error', 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);
            }

            // Verify actual MIME types
            if ($request->hasFile('file') && !$this->verifyFileMimeType($request->file('file'), self::ALLOWED_DOCUMENT_MIMES)) {
                return response()->json(['status' => 'error', 'message' => 'Tipe file dokumen tidak valid.'], 422);
            }
            if ($request->hasFile('logo') && !$this->verifyFileMimeType($request->file('logo'), self::ALLOWED_IMAGE_MIMES)) {
                return response()->json(['status' => 'error', 'message' => 'Tipe file logo tidak valid.'], 422);
            }
            if ($request->hasFile('logo_footer') && !$this->verifyFileMimeType($request->file('logo_footer'), self::ALLOWED_IMAGE_MIMES)) {
                return response()->json(['status' => 'error', 'message' => 'Tipe file logo footer tidak valid.'], 422);
            }

            $platformData = [];
            $fields = ['no_kontrak', 'judul', 'username', 'perusahaan', 'nama', 'email', 'no_hp', 'lokasi', 'domain'];
            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $platformData[$field] = $this->sanitizeInput($request->input($field));
                }
            }
            if ($request->has('coin_user')) $platformData['coin_user'] = (int) $request->input('coin_user');
            if ($request->has('kuota_user')) $platformData['kuota_user'] = (int) $request->input('kuota_user');
            if ($request->has('cart')) $platformData['cart'] = (bool) $request->input('cart');
            if ($request->has('tgl_mulai')) $platformData['tgl_mulai'] = $request->input('tgl_mulai');
            if ($request->has('tgl_akhir')) $platformData['tgl_akhir'] = $request->input('tgl_akhir');

            // Handle file uploads with replacement
            if ($request->hasFile('file')) {
                if ($platform->file && Storage::disk('public')->exists($platform->file)) {
                    Storage::disk('public')->delete($platform->file);
                }
                $platformData['file'] = $request->file('file')->store('platforms/' . $platform->uuid . '/documents', 'public');
            }
            if ($request->hasFile('logo')) {
                if ($platform->logo && Storage::disk('public')->exists($platform->logo)) {
                    Storage::disk('public')->delete($platform->logo);
                }
                $platformData['logo'] = $request->file('logo')->store('platforms/' . $platform->uuid . '/logos', 'public');
            }
            if ($request->hasFile('logo_footer')) {
                if ($platform->logo_footer && Storage::disk('public')->exists($platform->logo_footer)) {
                    Storage::disk('public')->delete($platform->logo_footer);
                }
                $platformData['logo_footer'] = $request->file('logo_footer')->store('platforms/' . $platform->uuid . '/logos', 'public');
            }

            $platform->update($platformData);

            Log::info('Platform updated', ['user_id' => Auth::id(), 'platform_uuid' => $uuid, 'changes' => array_keys($platformData)]);

            return response()->json(['status' => 'success', 'message' => 'Platform berhasil diupdate.', 'data' => $platform]);
        } catch (\Exception $e) {
            Log::error('Failed to update platform: ' . $e->getMessage(), ['user_id' => Auth::id(), 'uuid' => $uuid]);
            return response()->json(['status' => 'error', 'message' => 'Gagal mengupdate platform.'], 500);
        }
    }

    public function destroy($uuid)
    {
        if (!$this->isValidUuid($uuid)) {
            return response()->json(['status' => 'error', 'message' => 'Format UUID tidak valid.'], 400);
        }

        try {
            $platform = Platformpreneur::where('uuid', $uuid)->first();
            if (!$platform) {
                return response()->json(['status' => 'error', 'message' => 'Platform tidak ditemukan.'], 404);
            }

            $platformName = $platform->judul;

            // Delete associated files
            if ($platform->file && Storage::disk('public')->exists($platform->file)) {
                Storage::disk('public')->delete($platform->file);
            }
            if ($platform->logo && Storage::disk('public')->exists($platform->logo)) {
                Storage::disk('public')->delete($platform->logo);
            }
            if ($platform->logo_footer && Storage::disk('public')->exists($platform->logo_footer)) {
                Storage::disk('public')->delete($platform->logo_footer);
            }

            // Delete the platform directory if empty
            $platformDir = 'platforms/' . $platform->uuid;
            if (Storage::disk('public')->exists($platformDir)) {
                Storage::disk('public')->deleteDirectory($platformDir);
            }

            $platform->delete();

            Log::info('Platform deleted', ['user_id' => Auth::id(), 'platform_uuid' => $uuid, 'name' => $platformName]);

            return response()->json(['status' => 'success', 'message' => 'Platform berhasil dihapus.']);
        } catch (\Exception $e) {
            Log::error('Failed to delete platform: ' . $e->getMessage(), ['user_id' => Auth::id(), 'uuid' => $uuid]);
            return response()->json(['status' => 'error', 'message' => 'Gagal menghapus platform.'], 500);
        }
    }
}
