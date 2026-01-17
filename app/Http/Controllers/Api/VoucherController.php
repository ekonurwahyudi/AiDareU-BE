<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Models\Store;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class VoucherController extends Controller
{
    /**
     * Allowed fields for mass assignment (security: prevent injection of unauthorized fields)
     */
    private $allowedFields = [
        'uuid_store',
        'kode_voucher',
        'keterangan',
        'kuota',
        'tgl_mulai',
        'tgl_berakhir',
        'status',
        'jenis_voucher',
        'tipe_diskon',
        'nilai_diskon',
        'minimum_pembelian',
        'maksimal_diskon'
    ];

    /**
     * Check if user has access to the store
     */
    private function userHasStoreAccess($uuidStore)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return false;
            }

            // Check if user owns the store (user_id matches user's uuid)
            // or has access through user_roles relationship
            $store = Store::where('uuid', $uuidStore)->first();

            if (!$store) {
                return false;
            }

            // Check direct ownership
            if ($store->user_id === $user->uuid) {
                return true;
            }

            // Check through user_roles table
            $hasRole = DB::table('user_roles')
                ->where('store_id', $store->id)
                ->where('user_id', $user->id)
                ->exists();

            return $hasRole;
        } catch (\Exception $e) {
            Log::error('Error checking store access: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Display a listing of vouchers for current store.
     */
    public function index(Request $request)
    {
        try {
            $perPage = min($request->input('per_page', 10), 100); // Max 100 per page
            $search = $request->input('search', '');
            $uuidStore = $request->input('uuid_store');

            if (!$uuidStore) {
                return response()->json([
                    'success' => false,
                    'message' => 'UUID Store is required'
                ], 400);
            }

            // Security: Verify user has access to this store
            if (!$this->userHasStoreAccess($uuidStore)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this store'
                ], 403);
            }

            $query = Voucher::where('uuid_store', $uuidStore);

            // Search functionality with sanitized input
            if ($search) {
                $searchTerm = '%' . addcslashes($search, '%_') . '%';
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('kode_voucher', 'like', $searchTerm)
                      ->orWhere('keterangan', 'like', $searchTerm)
                      ->orWhere('jenis_voucher', 'like', $searchTerm);
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
                'message' => 'Failed to fetch vouchers'
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
                'keterangan' => 'required|string|max:1000',
                'kuota' => 'required|integer|min:1|max:1000000',
                'tgl_mulai' => 'required|date',
                'tgl_berakhir' => 'required|date|after:tgl_mulai',
                'status' => 'required|in:active,inactive,expired',
                'jenis_voucher' => 'required|in:ongkir,potongan_harga',
                'tipe_diskon' => 'required|in:persen,nominal',
                'nilai_diskon' => 'required|numeric|min:0|max:100000000',
                'minimum_pembelian' => 'nullable|numeric|min:0|max:100000000',
                'maksimal_diskon' => 'nullable|numeric|min:0|max:100000000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Security: Verify user has access to this store
            if (!$this->userHasStoreAccess($request->uuid_store)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this store'
                ], 403);
            }

            // Additional validation for percentage discount
            if ($request->tipe_diskon === 'persen' && $request->nilai_diskon > 100) {
                return response()->json([
                    'success' => false,
                    'message' => 'Persentase diskon tidak boleh lebih dari 100%'
                ], 422);
            }

            // Check if kode_voucher already exists for this store (case-insensitive)
            $exists = Voucher::where('uuid_store', $request->uuid_store)
                            ->whereRaw('UPPER(kode_voucher) = ?', [strtoupper($request->kode_voucher)])
                            ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode voucher sudah digunakan untuk toko ini'
                ], 422);
            }

            // Security: Only use allowed fields (prevent mass assignment vulnerability)
            $voucher = Voucher::create($request->only($this->allowedFields));

            return response()->json([
                'success' => true,
                'message' => 'Voucher berhasil ditambahkan',
                'data' => $voucher
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating voucher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create voucher'
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

            // Security: Verify user has access to this voucher's store
            if (!$this->userHasStoreAccess($voucher->uuid_store)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this voucher'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $voucher
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching voucher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch voucher'
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

            // Security: Verify user has access to this voucher's store
            if (!$this->userHasStoreAccess($voucher->uuid_store)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this voucher'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|exists:stores,uuid',
                'kode_voucher' => 'required|string|max:255',
                'keterangan' => 'required|string|max:1000',
                'kuota' => 'required|integer|min:1|max:1000000',
                'tgl_mulai' => 'required|date',
                'tgl_berakhir' => 'required|date|after:tgl_mulai',
                'status' => 'required|in:active,inactive,expired',
                'jenis_voucher' => 'required|in:ongkir,potongan_harga',
                'tipe_diskon' => 'required|in:persen,nominal',
                'nilai_diskon' => 'required|numeric|min:0|max:100000000',
                'minimum_pembelian' => 'nullable|numeric|min:0|max:100000000',
                'maksimal_diskon' => 'nullable|numeric|min:0|max:100000000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Security: Verify user also has access to the new store (if changing store)
            if ($request->uuid_store !== $voucher->uuid_store) {
                if (!$this->userHasStoreAccess($request->uuid_store)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized access to target store'
                    ], 403);
                }
            }

            // Additional validation for percentage discount
            if ($request->tipe_diskon === 'persen' && $request->nilai_diskon > 100) {
                return response()->json([
                    'success' => false,
                    'message' => 'Persentase diskon tidak boleh lebih dari 100%'
                ], 422);
            }

            // Check if kode_voucher already exists for this store (excluding current voucher)
            $exists = Voucher::where('uuid_store', $request->uuid_store)
                            ->whereRaw('UPPER(kode_voucher) = ?', [strtoupper($request->kode_voucher)])
                            ->where('uuid', '!=', $uuid)
                            ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode voucher sudah digunakan untuk toko ini'
                ], 422);
            }

            // Security: Only update allowed fields (prevent mass assignment vulnerability)
            // Also prevent updating kuota_terpakai through this endpoint
            $voucher->update($request->only($this->allowedFields));

            return response()->json([
                'success' => true,
                'message' => 'Voucher berhasil diupdate',
                'data' => $voucher->fresh()
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating voucher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update voucher'
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

            // Security: Verify user has access to this voucher's store
            if (!$this->userHasStoreAccess($voucher->uuid_store)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this voucher'
                ], 403);
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
                'message' => 'Failed to delete voucher'
            ], 500);
        }
    }

    /**
     * Validate voucher code for checkout.
     * This is a public endpoint (no auth required)
     */
    public function validate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|exists:stores,uuid',
                'kode_voucher' => 'required|string|max:255',
                'total_belanja' => 'required|numeric|min:0|max:100000000000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Search voucher case-insensitive with sanitized input
            $kodeVoucher = strtoupper(trim($request->kode_voucher));
            $voucher = Voucher::where('uuid_store', $request->uuid_store)
                             ->whereRaw('UPPER(kode_voucher) = ?', [$kodeVoucher])
                             ->first();

            if (!$voucher) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode voucher tidak ditemukan'
                ], 404);
            }

            if (!$voucher->isValid()) {
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
            $diskon = $this->calculateDiscount($voucher, $request->total_belanja);

            // Return only necessary data (security: don't expose all voucher fields)
            return response()->json([
                'success' => true,
                'message' => 'Voucher valid',
                'data' => [
                    'voucher' => [
                        'uuid' => $voucher->uuid,
                        'kode_voucher' => $voucher->kode_voucher,
                        'jenis_voucher' => $voucher->jenis_voucher,
                        'tipe_diskon' => $voucher->tipe_diskon,
                        'nilai_diskon' => $voucher->nilai_diskon,
                        'minimum_pembelian' => $voucher->minimum_pembelian,
                        'maksimal_diskon' => $voucher->maksimal_diskon
                    ],
                    'diskon' => $diskon,
                    'jenis_voucher' => $voucher->jenis_voucher,
                    'tipe_diskon' => $voucher->tipe_diskon
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error validating voucher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate voucher'
            ], 500);
        }
    }

    /**
     * Calculate discount amount based on voucher type
     */
    private function calculateDiscount(Voucher $voucher, float $totalBelanja): float
    {
        $diskon = 0;

        if ($voucher->jenis_voucher === 'ongkir') {
            // Untuk ongkir, diskon adalah nilai penuh
            $diskon = (float) $voucher->nilai_diskon;
        } else {
            // Untuk potongan harga
            if ($voucher->tipe_diskon === 'persen') {
                // Hitung diskon berdasarkan persentase
                $diskon = ($totalBelanja * (float) $voucher->nilai_diskon) / 100;

                // Batasi dengan maksimal diskon jika ada
                if ($voucher->maksimal_diskon && $diskon > (float) $voucher->maksimal_diskon) {
                    $diskon = (float) $voucher->maksimal_diskon;
                }
            } else {
                // Diskon nominal langsung
                $diskon = (float) $voucher->nilai_diskon;
            }
        }

        return round($diskon, 2);
    }

    /**
     * Re-validate and use voucher at checkout (called from CheckoutController)
     * Uses database locking to prevent race conditions
     */
    public static function useVoucherAtCheckout(string $voucherUuid, string $uuidStore, float $totalBelanja): array
    {
        return DB::transaction(function () use ($voucherUuid, $uuidStore, $totalBelanja) {
            // Lock the voucher row for update to prevent race condition
            $voucher = Voucher::where('uuid', $voucherUuid)
                             ->where('uuid_store', $uuidStore)
                             ->lockForUpdate()
                             ->first();

            if (!$voucher) {
                return [
                    'success' => false,
                    'message' => 'Voucher tidak ditemukan'
                ];
            }

            // Re-validate voucher
            if (!$voucher->isValid()) {
                return [
                    'success' => false,
                    'message' => 'Voucher sudah tidak valid atau kuota habis'
                ];
            }

            // Check minimum purchase
            if ($voucher->minimum_pembelian && $totalBelanja < $voucher->minimum_pembelian) {
                return [
                    'success' => false,
                    'message' => "Minimum pembelian Rp " . number_format($voucher->minimum_pembelian, 0, ',', '.')
                ];
            }

            // Calculate discount
            $diskon = 0;
            if ($voucher->jenis_voucher === 'ongkir') {
                $diskon = (float) $voucher->nilai_diskon;
            } else {
                if ($voucher->tipe_diskon === 'persen') {
                    $diskon = ($totalBelanja * (float) $voucher->nilai_diskon) / 100;
                    if ($voucher->maksimal_diskon && $diskon > (float) $voucher->maksimal_diskon) {
                        $diskon = (float) $voucher->maksimal_diskon;
                    }
                } else {
                    $diskon = (float) $voucher->nilai_diskon;
                }
            }

            // Increment usage count atomically
            $voucher->increment('kuota_terpakai');

            return [
                'success' => true,
                'voucher' => $voucher->fresh(),
                'diskon' => round($diskon, 2)
            ];
        });
    }
}
