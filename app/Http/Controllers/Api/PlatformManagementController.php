<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Platformpreneur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PlatformManagementController extends Controller
{
    /**
     * Get all platforms with pagination (for master data)
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search');

            $query = Platformpreneur::query();

            // Search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('no_kontrak', 'like', "%{$search}%")
                      ->orWhere('judul', 'like', "%{$search}%")
                      ->orWhere('perusahaan', 'like', "%{$search}%")
                      ->orWhere('domain', 'like', "%{$search}%")
                      ->orWhere('nama', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $platforms = $query->orderBy('created_at', 'desc')
                              ->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $platforms
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to get platforms: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data platform. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Get a single platform by UUID
     */
    public function show($uuid)
    {
        try {
            $platform = Platformpreneur::where('uuid', $uuid)->first();

            if (!$platform) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Platform not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $platform
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to get platform: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data platform. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Create a new platform
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'no_kontrak' => 'required|string|unique:platformpreneur,no_kontrak',
                'judul' => 'required|string|max:255',
                'username' => 'required|string|unique:platformpreneur,username',
                'perusahaan' => 'required|string|max:255',
                'file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
                'nama' => 'required|string|max:255',
                'email' => 'required|email',
                'no_hp' => 'required|string|max:20',
                'lokasi' => 'required|string|max:255',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'logo_footer' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'coin_user' => 'required|integer|min:0',
                'kuota_user' => 'required|integer|min:0',
                'domain' => 'required|string|unique:platformpreneur,domain',
                'tgl_mulai' => 'required|date',
                'tgl_akhir' => 'required|date|after:tgl_mulai'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $platformData = $request->only([
                'no_kontrak', 'judul', 'username', 'perusahaan', 'nama',
                'email', 'no_hp', 'lokasi', 'coin_user', 'kuota_user',
                'domain', 'tgl_mulai', 'tgl_akhir'
            ]);

            // Create platform first to get UUID
            $platform = Platformpreneur::create($platformData);

            // Handle file uploads
            if ($request->hasFile('file')) {
                $filePath = $request->file('file')->store('platforms/' . $platform->uuid . '/documents', 'public');
                $platform->file = $filePath;
            }

            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('platforms/' . $platform->uuid . '/logos', 'public');
                $platform->logo = $logoPath;
            }

            if ($request->hasFile('logo_footer')) {
                $logoFooterPath = $request->file('logo_footer')->store('platforms/' . $platform->uuid . '/logos', 'public');
                $platform->logo_footer = $logoFooterPath;
            }

            $platform->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Platform created successfully',
                'data' => $platform
            ], 201);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to create platform: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat platform. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Update an existing platform
     */
    public function update(Request $request, $uuid)
    {
        try {
            $platform = Platformpreneur::where('uuid', $uuid)->first();

            if (!$platform) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Platform not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'no_kontrak' => 'sometimes|required|string|unique:platformpreneur,no_kontrak,' . $platform->id,
                'judul' => 'sometimes|required|string|max:255',
                'username' => 'sometimes|required|string|unique:platformpreneur,username,' . $platform->id,
                'perusahaan' => 'sometimes|required|string|max:255',
                'file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
                'nama' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email',
                'no_hp' => 'sometimes|required|string|max:20',
                'lokasi' => 'sometimes|required|string|max:255',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'logo_footer' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'coin_user' => 'sometimes|required|integer|min:0',
                'kuota_user' => 'sometimes|required|integer|min:0',
                'domain' => 'sometimes|required|string|unique:platformpreneur,domain,' . $platform->id,
                'tgl_mulai' => 'sometimes|required|date',
                'tgl_akhir' => 'sometimes|required|date|after:tgl_mulai'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $platformData = $request->only([
                'no_kontrak', 'judul', 'username', 'perusahaan', 'nama',
                'email', 'no_hp', 'lokasi', 'coin_user', 'kuota_user',
                'domain', 'tgl_mulai', 'tgl_akhir'
            ]);

            // Handle file uploads with replacement
            if ($request->hasFile('file')) {
                // Delete old file if exists
                if ($platform->file && Storage::disk('public')->exists($platform->file)) {
                    Storage::disk('public')->delete($platform->file);
                }
                $filePath = $request->file('file')->store('platforms/' . $platform->uuid . '/documents', 'public');
                $platformData['file'] = $filePath;
            }

            if ($request->hasFile('logo')) {
                // Delete old logo if exists
                if ($platform->logo && Storage::disk('public')->exists($platform->logo)) {
                    Storage::disk('public')->delete($platform->logo);
                }
                $logoPath = $request->file('logo')->store('platforms/' . $platform->uuid . '/logos', 'public');
                $platformData['logo'] = $logoPath;
            }

            if ($request->hasFile('logo_footer')) {
                // Delete old logo footer if exists
                if ($platform->logo_footer && Storage::disk('public')->exists($platform->logo_footer)) {
                    Storage::disk('public')->delete($platform->logo_footer);
                }
                $logoFooterPath = $request->file('logo_footer')->store('platforms/' . $platform->uuid . '/logos', 'public');
                $platformData['logo_footer'] = $logoFooterPath;
            }

            $platform->update($platformData);

            return response()->json([
                'status' => 'success',
                'message' => 'Platform updated successfully',
                'data' => $platform
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to update platform: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengupdate platform. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Delete a platform
     */
    public function destroy($uuid)
    {
        try {
            $platform = Platformpreneur::where('uuid', $uuid)->first();

            if (!$platform) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Platform not found'
                ], 404);
            }

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

            return response()->json([
                'status' => 'success',
                'message' => 'Platform deleted successfully'
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to delete platform: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus platform. Silakan coba lagi.'
            ], 500);
        }
    }
}
