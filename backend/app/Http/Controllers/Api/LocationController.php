<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class LocationController extends Controller
{
    /**
     * Get list of cities/regencies from Indonesian API
     */
    public function getCities(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search', '');
            $limit = $request->get('limit', 50);
            $provinceCode = $request->get('province_code', '31'); // Default to Jakarta
            
            // Cache key based on search term and province
            $cacheKey = 'cities_' . $provinceCode . '_' . md5($search);
            
            $cities = Cache::remember($cacheKey, now()->addHours(24), function() use ($search, $limit, $provinceCode) {
                // Using API from wilayah.id
                try {
                    $response = Http::timeout(10)->get("https://wilayah.id/api/regencies/{$provinceCode}.json");
                    
                    if ($response->successful()) {
                        $result = $response->json();
                        $allCities = $result['data'] ?? [];
                        
                        // Filter by search term if provided
                        if (!empty($search)) {
                            $allCities = array_filter($allCities, function($city) use ($search) {
                                return stripos($city['name'], $search) !== false;
                            });
                        }
                        
                        // Reset array keys after filtering
                        $allCities = array_values($allCities);
                        
                        // Limit results
                        return array_slice($allCities, 0, $limit);
                    }
                } catch (\Exception $e) {
                    // Log error but continue with fallback
                    \Log::warning('Failed to fetch from wilayah.id API: ' . $e->getMessage());
                }
                
                // Fallback to all provinces if specific province fails
                try {
                    $response = Http::timeout(10)->get('https://wilayah.id/api/regencies.json');
                    
                    if ($response->successful()) {
                        $result = $response->json();
                        $allCities = $result['data'] ?? [];
                        
                        // Filter by search term if provided
                        if (!empty($search)) {
                            $allCities = array_filter($allCities, function($city) use ($search) {
                                return stripos($city['name'], $search) !== false;
                            });
                        }
                        
                        // Reset array keys after filtering
                        $allCities = array_values($allCities);
                        
                        // Limit results
                        return array_slice($allCities, 0, $limit);
                    }
                } catch (\Exception $e) {
                    \Log::warning('Failed to fetch from wilayah.id fallback API: ' . $e->getMessage());
                }
                
                // Final fallback data
                $fallbackCities = [
                    ['code' => '3171', 'name' => 'Kota Jakarta Selatan'],
                    ['code' => '3172', 'name' => 'Kota Jakarta Timur'], 
                    ['code' => '3173', 'name' => 'Kota Jakarta Pusat'],
                    ['code' => '3174', 'name' => 'Kota Jakarta Barat'],
                    ['code' => '3175', 'name' => 'Kota Jakarta Utara'],
                    ['code' => '3201', 'name' => 'Kabupaten Bogor'],
                    ['code' => '3271', 'name' => 'Kota Bogor'],
                    ['code' => '3204', 'name' => 'Kabupaten Bandung'],
                    ['code' => '3273', 'name' => 'Kota Bandung'],
                    ['code' => '3275', 'name' => 'Kota Bekasi'],
                    ['code' => '3276', 'name' => 'Kota Depok'],
                    ['code' => '3277', 'name' => 'Kota Cimahi'],
                ];
                
                // Filter fallback data by search term
                if (!empty($search)) {
                    $fallbackCities = array_filter($fallbackCities, function($city) use ($search) {
                        return stripos($city['name'], $search) !== false;
                    });
                    $fallbackCities = array_values($fallbackCities);
                }
                
                return array_slice($fallbackCities, 0, $limit);
            });
            
            return response()->json([
                'success' => true,
                'data' => $cities
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching cities data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get provinces (for reference if needed)
     */
    public function getProvinces(): JsonResponse
    {
        try {
            $provinces = Cache::remember('provinces', now()->addDays(7), function() {
                try {
                    $response = Http::timeout(10)->get('https://wilayah.id/api/provinces.json');
                    
                    if ($response->successful()) {
                        $result = $response->json();
                        return $result['data'] ?? [];
                    }
                } catch (\Exception $e) {
                    \Log::warning('Failed to fetch provinces from wilayah.id API: ' . $e->getMessage());
                }
                
                // Fallback provinces data
                return [
                    ['code' => '11', 'name' => 'Aceh'],
                    ['code' => '12', 'name' => 'Sumatera Utara'],
                    ['code' => '13', 'name' => 'Sumatera Barat'],
                    ['code' => '14', 'name' => 'Riau'],
                    ['code' => '15', 'name' => 'Jambi'],
                    ['code' => '16', 'name' => 'Sumatera Selatan'],
                    ['code' => '17', 'name' => 'Bengkulu'],
                    ['code' => '18', 'name' => 'Lampung'],
                    ['code' => '19', 'name' => 'Kepulauan Bangka Belitung'],
                    ['code' => '21', 'name' => 'Kepulauan Riau'],
                    ['code' => '31', 'name' => 'DKI Jakarta'],
                    ['code' => '32', 'name' => 'Jawa Barat'],
                    ['code' => '33', 'name' => 'Jawa Tengah'],
                    ['code' => '34', 'name' => 'DI Yogyakarta'],
                    ['code' => '35', 'name' => 'Jawa Timur'],
                    ['code' => '36', 'name' => 'Banten'],
                    ['code' => '51', 'name' => 'Bali'],
                    ['code' => '52', 'name' => 'Nusa Tenggara Barat'],
                    ['code' => '53', 'name' => 'Nusa Tenggara Timur'],
                    ['code' => '61', 'name' => 'Kalimantan Barat'],
                    ['code' => '62', 'name' => 'Kalimantan Tengah'],
                    ['code' => '63', 'name' => 'Kalimantan Selatan'],
                    ['code' => '64', 'name' => 'Kalimantan Timur'],
                    ['code' => '65', 'name' => 'Kalimantan Utara'],
                    ['code' => '71', 'name' => 'Sulawesi Utara'],
                    ['code' => '72', 'name' => 'Sulawesi Tengah'],
                    ['code' => '73', 'name' => 'Sulawesi Selatan'],
                    ['code' => '74', 'name' => 'Sulawesi Tenggara'],
                    ['code' => '75', 'name' => 'Gorontalo'],
                    ['code' => '76', 'name' => 'Sulawesi Barat'],
                    ['code' => '81', 'name' => 'Maluku'],
                    ['code' => '82', 'name' => 'Maluku Utara'],
                    ['code' => '91', 'name' => 'Papua Barat'],
                    ['code' => '94', 'name' => 'Papua']
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $provinces
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching provinces data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
