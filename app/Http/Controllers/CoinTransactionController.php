<?php

namespace App\Http\Controllers;

use App\Models\CoinTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CoinTransactionController extends Controller
{
    /**
     * Get coin transactions untuk user yang sedang login dengan filter
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Validasi input filter
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'search' => 'nullable|string|max:255',
                'per_page' => 'nullable|integer|min:1|max:100',
            ]);

            $query = CoinTransaction::forUser($user->uuid)
                ->orderBy('created_at', 'desc');

            // Filter by date range
            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->dateRange(
                    $request->start_date . ' 00:00:00',
                    $request->end_date . ' 23:59:59'
                );
            }

            // Filter by search (keterangan)
            if ($request->filled('search')) {
                $query->where('keterangan', 'like', '%' . $request->search . '%');
            }

            // Pagination
            $perPage = $request->input('per_page', 10);
            $transactions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $transactions,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching coin transactions:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data transaksi coin'
            ], 500);
        }
    }

    /**
     * Get summary coin untuk user yang sedang login
     */
    public function summary(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Validasi input filter
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            $query = CoinTransaction::forUser($user->uuid);

            // Filter by date range jika ada
            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->dateRange(
                    $request->start_date . ' 00:00:00',
                    $request->end_date . ' 23:59:59'
                );
            }

            // Hitung total coin masuk dan keluar
            $summary = $query->select(
                DB::raw('SUM(coin_masuk) as total_coin_masuk'),
                DB::raw('SUM(coin_keluar) as total_coin_keluar')
            )->first();

            $totalCoinMasuk = $summary->total_coin_masuk ?? 0;
            $totalCoinKeluar = $summary->total_coin_keluar ?? 0;
            $coinSaatIni = $totalCoinMasuk - $totalCoinKeluar;

            return response()->json([
                'success' => true,
                'data' => [
                    'coin_saat_ini' => $coinSaatIni,
                    'total_coin_masuk' => $totalCoinMasuk,
                    'total_coin_keluar' => $totalCoinKeluar,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching coin summary:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil summary coin'
            ], 500);
        }
    }

    /**
     * Create new coin transaction (untuk testing atau admin)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $request->validate([
                'keterangan' => 'required|string|max:255',
                'coin_masuk' => 'nullable|integer|min:0',
                'coin_keluar' => 'nullable|integer|min:0',
                'status' => 'nullable|string|in:berhasil,pending,gagal',
            ]);

            $transaction = CoinTransaction::create([
                'uuid_user' => $user->uuid,
                'keterangan' => $request->keterangan,
                'coin_masuk' => $request->input('coin_masuk', 0),
                'coin_keluar' => $request->input('coin_keluar', 0),
                'status' => $request->input('status', 'berhasil'),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transaksi coin berhasil dibuat',
                'data' => $transaction,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating coin transaction:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat transaksi coin'
            ], 500);
        }
    }

    /**
     * Export coin transactions to CSV
     */
    public function export(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Validasi input filter
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            $query = CoinTransaction::forUser($user->uuid)
                ->orderBy('created_at', 'desc');

            // Filter by date range
            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->dateRange(
                    $request->start_date . ' 00:00:00',
                    $request->end_date . ' 23:59:59'
                );
            }

            $transactions = $query->get();

            // Generate CSV
            $filename = 'coin_transactions_' . date('Y-m-d_His') . '.csv';
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            $callback = function() use ($transactions) {
                $file = fopen('php://output', 'w');

                // Header CSV
                fputcsv($file, ['No', 'Tanggal', 'Keterangan', 'Coin Masuk', 'Coin Keluar', 'Status']);

                // Data
                $no = 1;
                foreach ($transactions as $transaction) {
                    fputcsv($file, [
                        $no++,
                        $transaction->created_at->format('d/m/Y H:i'),
                        $transaction->keterangan,
                        $transaction->coin_masuk,
                        $transaction->coin_keluar,
                        $transaction->status,
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            Log::error('Error exporting coin transactions:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal export data transaksi coin'
            ], 500);
        }
    }
}
