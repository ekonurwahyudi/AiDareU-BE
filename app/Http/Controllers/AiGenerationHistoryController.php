<?php

namespace App\Http\Controllers;

use App\Models\AiGenerationHistory;
use App\Models\CoinTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AiGenerationHistoryController extends Controller
{
    /**
     * Get AI generation histories untuk user yang sedang login
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
                'search' => 'nullable|string|max:255',
                'per_page' => 'nullable|integer|min:1|max:100',
            ]);

            $query = AiGenerationHistory::forUser($user->uuid)
                ->orderBy('created_at', 'desc');

            // Filter by search (keterangan) - case insensitive
            if ($request->filled('search')) {
                $query->whereRaw('LOWER(keterangan) LIKE ?', ['%' . strtolower($request->search) . '%']);
            }

            // Pagination
            $perPage = $request->input('per_page', 10);
            $histories = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $histories,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching AI generation histories:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data riwayat AI generation'
            ], 500);
        }
    }

    /**
     * Check if user has enough coin to generate AI
     */
    public function checkCoin(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Hitung total coin user
            $coinSummary = CoinTransaction::forUser($user->uuid)
                ->select(
                    DB::raw('SUM(coin_masuk) as total_coin_masuk'),
                    DB::raw('SUM(coin_keluar) as total_coin_keluar')
                )
                ->first();

            $totalCoinMasuk = $coinSummary->total_coin_masuk ?? 0;
            $totalCoinKeluar = $coinSummary->total_coin_keluar ?? 0;
            $coinSaatIni = $totalCoinMasuk - $totalCoinKeluar;

            $requiredCoin = 2; // Setiap generate membutuhkan 2 coin

            return response()->json([
                'success' => true,
                'data' => [
                    'current_coin' => $coinSaatIni,
                    'required_coin' => $requiredCoin,
                    'has_enough' => $coinSaatIni >= $requiredCoin,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error checking user coin:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengecek coin'
            ], 500);
        }
    }

    /**
     * Store AI generation history and deduct coin
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
                'hasil_generated' => 'required|string',
                'coin_used' => 'nullable|integer|min:1',
            ]);

            $coinUsed = $request->input('coin_used', 2);

            // Check if user has enough coin
            $coinSummary = CoinTransaction::forUser($user->uuid)
                ->select(
                    DB::raw('SUM(coin_masuk) as total_coin_masuk'),
                    DB::raw('SUM(coin_keluar) as total_coin_keluar')
                )
                ->first();

            $totalCoinMasuk = $coinSummary->total_coin_masuk ?? 0;
            $totalCoinKeluar = $coinSummary->total_coin_keluar ?? 0;
            $coinSaatIni = $totalCoinMasuk - $totalCoinKeluar;

            if ($coinSaatIni < $coinUsed) {
                return response()->json([
                    'success' => false,
                    'message' => 'Coin tidak cukup. Anda membutuhkan ' . $coinUsed . ' coin.',
                    'current_coin' => $coinSaatIni,
                    'required_coin' => $coinUsed,
                ], 400);
            }

            // Use transaction to ensure data consistency
            DB::beginTransaction();

            try {
                // Create AI generation history
                $history = AiGenerationHistory::create([
                    'uuid_user' => $user->uuid,
                    'keterangan' => $request->keterangan,
                    'hasil_generated' => $request->hasil_generated,
                    'coin_used' => $coinUsed,
                ]);

                // Deduct coin from user
                CoinTransaction::create([
                    'uuid_user' => $user->uuid,
                    'keterangan' => $request->keterangan,
                    'coin_masuk' => 0,
                    'coin_keluar' => $coinUsed,
                    'status' => 'berhasil',
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Berhasil generate AI dan menyimpan history',
                    'data' => $history,
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Error storing AI generation history:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan history AI generation'
            ], 500);
        }
    }

    /**
     * Delete AI generation history
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $history = AiGenerationHistory::where('id', $id)
                ->where('uuid_user', $user->uuid)
                ->first();

            if (!$history) {
                return response()->json([
                    'success' => false,
                    'message' => 'History tidak ditemukan'
                ], 404);
            }

            $history->delete();

            return response()->json([
                'success' => true,
                'message' => 'History berhasil dihapus',
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting AI generation history:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus history'
            ], 500);
        }
    }
}
