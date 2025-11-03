<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $user = $request->user();
        $storeId = $request->route('store_id') ?? $request->input('store_id') ?? session('current_store_id');

        // Check if user has any of the required roles
        foreach ($roles as $role) {
            if ($user->hasRole($role, $storeId)) {
                return $next($request);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Insufficient permissions'
        ], 403);
    }
}