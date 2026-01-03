<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerManagementController extends Controller
{
    /**
     * Get all customers across all stores (for master data)
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search');

            $query = Customer::query();

            // Search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nama', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('no_hp', 'like', "%{$search}%")
                      ->orWhere('kota', 'like', "%{$search}%");
                });
            }

            // Include store relationship
            $customers = $query->with('store:uuid,nama_toko,subdomain')
                              ->orderBy('created_at', 'desc')
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
}
