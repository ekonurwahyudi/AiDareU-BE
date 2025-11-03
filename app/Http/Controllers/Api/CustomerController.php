<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    /**
     * Get all customers for a specific store
     */
    public function index(Request $request, $storeUuid)
    {
        try {
            // Get authenticated user
            $user = null;
            if ($request->bearerToken()) {
                $user = auth('sanctum')->user();
            }
            if (!$user) {
                $user = auth('web')->user();
            }
            if (!$user && $request->header('X-User-UUID')) {
                $uuid = $request->header('X-User-UUID');
                $user = \App\Models\User::where('uuid', $uuid)->first();
            }

            // Check if user is superadmin
            $isSuperadmin = $user && $user->hasRole('superadmin');

            $perPage = $request->get('per_page', 10);
            $search = $request->get('search');

            $query = Customer::query();

            // Filter by store UUID
            if ($storeUuid) {
                // Both superadmin and regular users: if storeUuid provided, filter by it
                $query->where('uuid_store', $storeUuid);
            } elseif (!$isSuperadmin) {
                // Non-superadmin without storeUuid: should not happen, return empty
                return response()->json([
                    'status' => 'error',
                    'message' => 'Store UUID is required for non-superadmin users',
                    'data' => [
                        'data' => [],
                        'total' => 0
                    ]
                ], 400);
            }
            // Superadmin without storeUuid: show all customers (no filter)

            // Search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nama', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('no_hp', 'like', "%{$search}%")
                      ->orWhere('kota', 'like', "%{$search}%");
                });
            }

            $customers = $query->orderBy('created_at', 'desc')
                              ->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $customers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single customer by UUID
     */
    public function show($uuid)
    {
        try {
            $customer = Customer::where('uuid', $uuid)->first();

            if (!$customer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $customer
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new customer
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'uuid_store' => 'required|uuid|exists:stores,uuid',
                'nama' => 'required|string|max:255',
                'no_hp' => 'required|string|max:20',
                'email' => 'nullable|email|max:255',
                'provinsi' => 'required|string|max:100',
                'kota' => 'required|string|max:100',
                'kecamatan' => 'required|string|max:100',
                'alamat' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $customer = Customer::create($request->all());

            return response()->json([
                'status' => 'success',
                'message' => 'Customer created successfully',
                'data' => $customer
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing customer
     */
    public function update(Request $request, $uuid)
    {
        try {
            $customer = Customer::where('uuid', $uuid)->first();

            if (!$customer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nama' => 'sometimes|required|string|max:255',
                'no_hp' => 'sometimes|required|string|max:20',
                'email' => 'nullable|email|max:255',
                'provinsi' => 'sometimes|required|string|max:100',
                'kota' => 'sometimes|required|string|max:100',
                'kecamatan' => 'sometimes|required|string|max:100',
                'alamat' => 'sometimes|required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $customer->update($request->all());

            return response()->json([
                'status' => 'success',
                'message' => 'Customer updated successfully',
                'data' => $customer
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a customer
     */
    public function destroy($uuid)
    {
        try {
            $customer = Customer::where('uuid', $uuid)->first();

            if (!$customer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer not found'
                ], 404);
            }

            $customer->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Customer deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
