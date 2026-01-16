<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class VoucherController extends Controller
{
    /**
     * Display a listing of vouchers for current store.
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 10);
            $search = $request->input('search', '');
            $uuidStore = $request->input('uuid_store');

            if (!$uuidStore) {
                return response()->json([
                    'success' => false,
                    'message' => 'UUID Store is required'
                ], 400);
            }

            $query = Voucher::where('uuid_store', $uuidStore);

            // Search functionality
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('kode_voucher', 'like', "%{$search}%")
                      ->orWhere('keterangan', 'like', "%{$search}%")
                      ->orWhere('jenis_voucher', 'like', "%{$search}%");
                });
            }

            $vouchers = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $vouchers
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching vouchers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vouchers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created voucher.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|exists:stores,uuid',
                'kode_voucher' => 'required|string|max:255',
                'keterangan' => 'required|string',
                'kuota' => 'required|integer|min:1',
                'tgl_mulai' => 'required|date',
                'tgl_berakhir' => 'required|date|after:tgl_mulai',
                'status' => 'required|in:active,inactive,expired',
                'jenis_voucher' => 'required|in:ongkir,potongan_harga',
                'tipe_diskon' => 'required|in:persen,nominal',
                'nilai_diskon' => 'required|numeric|min:0',
                'minimum_pembelian' => 'nullable|numeric|min:0',
                'maksimal_diskon' => 'nullable|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if kode_voucher already exists for this store
            $exists = Voucher::where('uuid_store', $request->uuid_store)
                            ->where('kode_voucher', $request->kode_voucher)
                            ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode voucher sudah digunakan untuk toko ini'
                ], 422);
            }

            $voucher = Voucher::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Voucher berhasil ditambahkan',
                'data' => $voucher
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating voucher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create voucher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified voucher.
     */
    public function show($uuid)
    {
        try {
            $voucher = Voucher::where('uuid', $uuid)->first();

            if (!$voucher) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $voucher
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching voucher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch voucher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified voucher.
     */
    public function update(Request $request, $uuid)
    {
        try {
            $voucher = Voucher::where('uuid', $uuid)->first();

            if (!$voucher) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|exists:stores,uuid',
                'kode_voucher' => 'required|string|max:255',
                'keterangan' => 'required|string',
                'kuota' => 'required|integer|min:1',
                'tgl_mulai' => 'required|date',
                'tgl_berakhir' => 'required|date|after:tgl_mulai',
                'status' => 'required|in:active,inactive,expired',
                'jenis_voucher' => 'required|in:ongkir,potongan_harga',
                'tipe_diskon' => 'required|in:persen,nominal',
                'nilai_diskon' => 'required|numeric|min:0',
                'minimum_pembelian' => 'nullable|numeric|min:0',
                'maksimal_diskon' => 'nullable|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if kode_voucher already exists for this store (excluding current voucher)
            $exists = Voucher::where('uuid_store', $request->uuid_store)
                            ->where('kode_voucher', $request->kode_voucher)
                            ->where('uuid', '!=', $uuid)
                            ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode voucher sudah digunakan untuk toko ini'
                ], 422);
            }

            $voucher->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Voucher berhasil diupdate',
                'data' => $voucher
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating voucher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update voucher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified voucher.
     */
    public function destroy($uuid)
    {
        try {
            $voucher = Voucher::where('uuid', $uuid)->first();

            if (!$voucher) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher not found'
                ], 404);
            }

            $voucher->delete();

            return response()->json([
                'success' => true,
                'message' => 'Voucher berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting voucher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete voucher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate voucher code for checkout.
     */
    public function validate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|exists:stores,uuid',
                'kode_voucher' => 'required|string',
                'total_belanja' => 'required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Search voucher case-insensitive
            $voucher = Voucher::where('uuid_store', $request->uuid_store)
                             ->whereRaw('UPPER(kode_voucher) = ?', [strtoupper($request->kode_voucher)])
                             ->first();

            // Log the search for debugging
            Log::info('Voucher search', [
                'uuid_store' => $request->uuid_store,
                'kode_voucher' => $request->kode_voucher,
                'kode_voucher_upper' => strtoupper($request->kode_voucher),
                'found' => $voucher ? true : false
            ]);

            if (!$voucher) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode voucher tidak ditemukan'
                ], 404);
            }

            if (!$voucher->isValid()) {
                // Log detail untuk debugging
                Log::info('Voucher validation failed', [
                    'kode_voucher' => $voucher->kode_voucher,
                    'status' => $voucher->status,
                    'tgl_mulai' => $voucher->tgl_mulai,
                    'tgl_berakhir' => $voucher->tgl_berakhir,
                    'kuota' => $voucher->kuota,
                    'kuota_terpakai' => $voucher->kuota_terpakai,
                    'today' => now()->toDateString()
                ]);

                // Return specific error message
                $today = now()->startOfDay();
                $tglMulai = $voucher->tgl_mulai instanceof Carbon
                    ? $voucher->tgl_mulai->startOfDay()
                    : Carbon::parse($voucher->tgl_mulai)->startOfDay();
                $tglBerakhir = $voucher->tgl_berakhir instanceof Carbon
                    ? $voucher->tgl_berakhir->startOfDay()
                    : Carbon::parse($voucher->tgl_berakhir)->startOfDay();

                if ($voucher->status !== 'active') {
                    $message = 'Voucher tidak aktif';
                } elseif ($tglMulai->gt($today)) {
                    $message = 'Voucher belum berlaku. Berlaku mulai ' . $tglMulai->format('d/m/Y');
                } elseif ($tglBerakhir->lt($today)) {
                    $message = 'Voucher sudah expired sejak ' . $tglBerakhir->format('d/m/Y');
                } elseif ($voucher->kuota_terpakai >= $voucher->kuota) {
                    $message = 'Kuota voucher sudah habis';
                } else {
                    $message = 'Voucher tidak valid';
                }

                return response()->json([
                    'success' => false,
                    'message' => $message
                ], 400);
            }

            // Check minimum purchase
            if ($voucher->minimum_pembelian && $request->total_belanja < $voucher->minimum_pembelian) {
                return response()->json([
                    'success' => false,
                    'message' => "Minimum pembelian Rp " . number_format($voucher->minimum_pembelian, 0, ',', '.')
                ], 400);
            }

            // Calculate discount
            $diskon = 0;

            if ($voucher->jenis_voucher === 'ongkir') {
                // Untuk ongkir, diskon adalah nilai penuh
                $diskon = $voucher->nilai_diskon;
            } else {
                // Untuk potongan harga
                if ($voucher->tipe_diskon === 'persen') {
                    // Hitung diskon berdasarkan persentase
                    $diskon = ($request->total_belanja * $voucher->nilai_diskon) / 100;

                    // Batasi dengan maksimal diskon jika ada
                    if ($voucher->maksimal_diskon && $diskon > $voucher->maksimal_diskon) {
                        $diskon = $voucher->maksimal_diskon;
                    }
                } else {
                    // Diskon nominal langsung
                    $diskon = $voucher->nilai_diskon;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Voucher valid',
                'data' => [
                    'voucher' => $voucher,
                    'diskon' => $diskon,
                    'jenis_voucher' => $voucher->jenis_voucher,
                    'tipe_diskon' => $voucher->tipe_diskon
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error validating voucher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate voucher',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
