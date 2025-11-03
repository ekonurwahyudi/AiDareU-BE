<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $user = $request->user();
        $storeId = $request->route('store_id') ?? $request->input('store_id') ?? session('current_store_id');

        // Check if user has all required permissions
        foreach ($permissions as $permission) {
            if (!$user->hasPermission($permission, $storeId)) {
                return response()->json([
                    'success' => false,
                    'message' => "Missing permission: {$permission}"
                ], 403);
            }
        }

        return $next($request);
    }
}