<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BankAccountController extends Controller
{
    public function index(Request $request, $store)
    {
        return response()->json(['data' => [], 'message' => 'OK']);
    }

    public function store(Request $request, $store)
    {
        return response()->json(['message' => 'Created'], 201);
    }

    public function update(Request $request, $store, $bankAccount)
    {
        return response()->json(['message' => 'Updated']);
    }

    public function destroy($store, $bankAccount)
    {
        return response()->json(null, 204);
    }

    public function setPrimary($store, $bankAccount)
    {
        return response()->json(['message' => 'Primary account set']);
    }

    /**
     * Get bank accounts by store UUID (for checkout flow)
     */
    public function getByStore($storeUuid): JsonResponse
    {
        try {
            // Validate store exists
            $store = Store::where('uuid', $storeUuid)->first();
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found',
                    'data' => []
                ], 404);
            }

            // Get bank accounts for this store
            $bankAccounts = BankAccount::where('store_uuid', $storeUuid)
                                    ->where('is_active', true)
                                    ->orderBy('is_primary', 'desc')
                                    ->orderBy('created_at', 'desc')
                                    ->get()
                                    ->map(function ($account) {
                                        return [
                                            'uuid' => $account->uuid,
                                            'store_uuid' => $account->store_uuid,
                                            'account_name' => $account->account_name ?? $account->account_holder_name,
                                            'bank_name' => $account->bank_name,
                                            'account_number' => $account->account_number,
                                            'is_primary' => $account->is_primary,
                                            'is_active' => $account->is_active,
                                            'bank_code' => $this->getBankCode($account->bank_name),
                                            'created_at' => $account->created_at,
                                            'updated_at' => $account->updated_at
                                        ];
                                    });

            return response()->json([
                'success' => true,
                'data' => $bankAccounts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get bank accounts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get bank code/acronym from bank name
     */
    private function getBankCode($bankName): string
    {
        $bankCodes = [
            'Bank Central Asia' => 'BCA',
            'Bank Rakyat Indonesia' => 'BRI',
            'Bank Mandiri' => 'Mandiri',
            'Bank Negara Indonesia' => 'BNI',
            'Bank Syariah Indonesia' => 'BSI',
            'Bank Permata' => 'Permata',
            'Bank Danamon' => 'Danamon',
            'Bank CIMB Niaga' => 'CIMB',
            'Bank Maybank' => 'Maybank'
        ];

        foreach ($bankCodes as $fullName => $code) {
            if (stripos($bankName, $fullName) !== false || stripos($bankName, $code) !== false) {
                return $code;
            }
        }

        // Return first 3 characters if no match found
        return strtoupper(substr($bankName, 0, 3));
    }

    /**
     * Get bank accounts for current user's store
     */
    public function userIndex(): JsonResponse
    {
        try {
            $user = null;

            // Try Sanctum auth first
            if (request()->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && request()->header('X-User-UUID')) {
                $uuid = request()->header('X-User-UUID');
                $user = \App\Models\User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated. Please login again.'
                ], 401);
            }

            // Get user's store
            $store = Store::where('user_id', $user->uuid)->first();
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found',
                    'data' => []
                ], 404);
            }

            // Get bank accounts for this store
            $bankAccounts = BankAccount::where('store_uuid', $store->uuid)
                                    ->where('is_active', true)
                                    ->orderBy('is_primary', 'desc')
                                    ->orderBy('created_at', 'desc')
                                    ->get()
                                    ->map(function ($account) {
                                        return [
                                            'uuid' => $account->uuid,
                                            'store_uuid' => $account->store_uuid,
                                            'account_name' => $account->account_name ?? $account->account_holder_name,
                                            'bank_name' => $account->bank_name,
                                            'account_number' => $account->account_number,
                                            'is_primary' => $account->is_primary,
                                            'is_active' => $account->is_active,
                                            'created_at' => $account->created_at,
                                            'updated_at' => $account->updated_at
                                        ];
                                    });

            return response()->json([
                'success' => true,
                'data' => $bankAccounts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get bank accounts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create bank account for current user's store
     */
    public function userStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'account_number' => 'required|string|min:8|max:20',
            'account_name' => 'required|string|max:100',
            'bank_name' => 'required|string|max:50',
            'is_primary' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = null;

            // Try Sanctum auth first
            if (request()->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && request()->header('X-User-UUID')) {
                $uuid = request()->header('X-User-UUID');
                $user = \App\Models\User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated. Please login again.'
                ], 401);
            }

            $store = Store::where('user_id', $user->uuid)->first();
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            // If this is set as primary, unset other primary accounts
            if ($request->get('is_primary', false)) {
                BankAccount::where('store_uuid', $store->uuid)
                          ->where('is_primary', true)
                          ->update(['is_primary' => false]);
            }

            $bankAccount = BankAccount::create([
                'uuid' => Str::uuid(),
                'store_uuid' => $store->uuid,
                'account_number' => $request->account_number,
                'account_holder_name' => $request->account_name,
                'bank_name' => $request->bank_name,
                'is_primary' => $request->get('is_primary', false),
                'is_active' => true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bank account created successfully',
                'data' => [
                    'uuid' => $bankAccount->uuid,
                    'store_uuid' => $bankAccount->store_uuid,
                    'account_name' => $bankAccount->account_name,
                    'bank_name' => $bankAccount->bank_name,
                    'account_number' => $bankAccount->account_number,
                    'is_primary' => $bankAccount->is_primary,
                    'is_active' => $bankAccount->is_active
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create bank account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update bank account
     */
    public function userUpdate(Request $request, $bankAccountUuid): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'account_number' => 'required|string|min:8|max:20',
            'account_name' => 'required|string|max:100',
            'bank_name' => 'required|string|max:50',
            'is_primary' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = null;

            // Try Sanctum auth first
            if (request()->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && request()->header('X-User-UUID')) {
                $uuid = request()->header('X-User-UUID');
                $user = \App\Models\User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated. Please login again.'
                ], 401);
            }

            $store = Store::where('user_id', $user->uuid)->first();
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            $bankAccount = BankAccount::where('uuid', $bankAccountUuid)
                                   ->where('store_uuid', $store->uuid)
                                   ->first();

            if (!$bankAccount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bank account not found'
                ], 404);
            }

            // If this is set as primary, unset other primary accounts
            if ($request->get('is_primary', false) && !$bankAccount->is_primary) {
                BankAccount::where('store_uuid', $store->uuid)
                          ->where('uuid', '!=', $bankAccountUuid)
                          ->where('is_primary', true)
                          ->update(['is_primary' => false]);
            }

            $bankAccount->update([
                'account_number' => $request->account_number,
                'account_holder_name' => $request->account_name,
                'bank_name' => $request->bank_name,
                'is_primary' => $request->get('is_primary', $bankAccount->is_primary)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bank account updated successfully',
                'data' => [
                    'uuid' => $bankAccount->uuid,
                    'store_uuid' => $bankAccount->store_uuid,
                    'account_name' => $bankAccount->account_name,
                    'bank_name' => $bankAccount->bank_name,
                    'account_number' => $bankAccount->account_number,
                    'is_primary' => $bankAccount->is_primary,
                    'is_active' => $bankAccount->is_active
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update bank account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete bank account
     */
    public function userDestroy($bankAccountUuid): JsonResponse
    {
        try {
            $user = null;

            // Try Sanctum auth first
            if (request()->bearerToken()) {
                $user = auth('sanctum')->user();
            }

            // Try web session auth
            if (!$user) {
                $user = auth('web')->user();
            }

            // Try X-User-UUID header
            if (!$user && request()->header('X-User-UUID')) {
                $uuid = request()->header('X-User-UUID');
                $user = \App\Models\User::where('uuid', $uuid)->first();
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated. Please login again.'
                ], 401);
            }

            $store = Store::where('user_id', $user->uuid)->first();
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            $bankAccount = BankAccount::where('uuid', $bankAccountUuid)
                                   ->where('store_uuid', $store->uuid)
                                   ->first();

            if (!$bankAccount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bank account not found'
                ], 404);
            }

            $bankAccount->delete();

            return response()->json([
                'success' => true,
                'message' => 'Bank account deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete bank account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getBanks()
    {
        $banks = [
            ['code' => 'BCA', 'name' => 'Bank Central Asia'],
            ['code' => 'BRI', 'name' => 'Bank Rakyat Indonesia'],
            ['code' => 'MANDIRI', 'name' => 'Bank Mandiri'],
            ['code' => 'BNI', 'name' => 'Bank Negara Indonesia'],
            ['code' => 'CIMB', 'name' => 'CIMB Niaga'],
        ];

        return response()->json(['data' => $banks]);
    }
}