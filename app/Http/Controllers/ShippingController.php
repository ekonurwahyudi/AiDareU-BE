<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;

class ShippingController extends Controller
{
    /**
     * Calculate shipping cost
     */
    public function calculate(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'store_uuid' => 'required|string|exists:stores,uuid',
                'destination_province' => 'required|string',
                'destination_city' => 'required|string',
                'destination_district' => 'required|string',
                'weight' => 'integer|min:1|max:30000' // max 30kg
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get store data
            $store = Store::where('uuid', $request->store_uuid)->first();
            if (!$store) {
                return response()->json([
                    'message' => 'Store not found'
                ], 404);
            }

            // Check if store has complete address
            if (!$store->provinsi || !$store->kota || !$store->kecamatan) {
                return response()->json([
                    'message' => 'Alamat toko belum lengkap'
                ], 400);
            }

            $weight = $request->weight ?? 1000; // default 1kg
            $originProvince = $store->provinsi;
            $originCity = $store->kota;
            $originDistrict = $store->kecamatan;

            $destinationProvince = $request->destination_province;
            $destinationCity = $request->destination_city;
            $destinationDistrict = $request->destination_district;

            // Calculate shipping costs for JNE and J&T
            $shippingOptions = $this->calculateShippingCosts(
                $originProvince,
                $originCity,
                $originDistrict,
                $destinationProvince,
                $destinationCity,
                $destinationDistrict,
                $weight
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'origin' => [
                        'province' => $originProvince,
                        'city' => $originCity,
                        'district' => $originDistrict
                    ],
                    'destination' => [
                        'province' => $destinationProvince,
                        'city' => $destinationCity,
                        'district' => $destinationDistrict
                    ],
                    'weight' => $weight,
                    'shipping_options' => $shippingOptions
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to calculate shipping cost',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate shipping costs for different couriers using RajaOngkir API
     */
    private function calculateShippingCosts($originProvince, $originCity, $originDistrict,
                                         $destinationProvince, $destinationCity, $destinationDistrict,
                                         $weight)
    {
        try {


            // Calculate shipping rates using Biteship API
            $shippingOptions = $this->getBiteshipRates(
                $originProvince,
                $originCity,
                $originDistrict,
                $destinationProvince,
                $destinationCity,
                $destinationDistrict,
                $weight
            );

            return $shippingOptions;

        } catch (\Exception $e) {
            // Re-throw the exception - no fallback
            throw new \Exception('Maaf sistem sedang mengalami gangguan');
        }
    }

    /**
     * Get shipping rates from Biteship API
     */
    private function getBiteshipRates($originProvince, $originCity, $originDistrict, $destinationProvince, $destinationCity, $destinationDistrict, $weight)
    {
        try {
            $apiKey = env('BITESHIP_API_KEY');

            if (!$apiKey || $apiKey === 'your_biteship_api_key_here') {
                \Log::error('Biteship API key not configured properly');
                throw new \Exception('Biteship API key not configured');
            }

            \Log::info('Biteship API Request:', [
                'origin_province' => $originProvince,
                'origin_city' => $originCity,
                'origin_district' => $originDistrict,
                'destination_province' => $destinationProvince,
                'destination_city' => $destinationCity,
                'destination_district' => $destinationDistrict,
                'weight' => $weight
            ]);

            $requestData = [
                'origin_postal_code' => null,
                'origin_area_id' => null,
                'origin_latitude' => null,
                'origin_longitude' => null,
                'destination_postal_code' => null,
                'destination_area_id' => null,
                'destination_latitude' => null,
                'destination_longitude' => null,
                'couriers' => 'jne,jnt,jet,jtr',
                'items' => [
                    [
                        'name' => 'Product',
                        'description' => 'Product description',
                        'value' => 10000,
                        'length' => 10,
                        'width' => 10,
                        'height' => 10,
                        'weight' => $weight,
                        'quantity' => 1
                    ]
                ]
            ];

            // Try to get area IDs using address lookup
            $originAreaId = $this->getBiteshipAreaId($originProvince, $originCity, $originDistrict);
            $destinationAreaId = $this->getBiteshipAreaId($destinationProvince, $destinationCity, $destinationDistrict);

            if ($originAreaId) {
                $requestData['origin_area_id'] = $originAreaId;
            }
            if ($destinationAreaId) {
                $requestData['destination_area_id'] = $destinationAreaId;
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json'
            ])->post('https://api.biteship.com/v1/rates/couriers', $requestData);

            $data = $response->json();

            // Log successful API response
            if (isset($data['pricing'])) {
                $courierNames = array_unique(array_column($data['pricing'], 'courier_name'));
                \Log::info('Biteship API success. Couriers available: ' . json_encode($courierNames));
            }

            if (!$response->successful() || !isset($data['success']) || !$data['success']) {
                $errorMsg = $data['message'] ?? 'Unknown error';
                \Log::error('Biteship API Error Response: ' . $errorMsg);
                throw new \Exception('API Error: ' . $errorMsg);
            }

            return $this->processBiteshipRates($data['pricing']);

        } catch (\Exception $e) {
            \Log::error('Biteship API Exception: ' . $e->getMessage());
            throw new \Exception('Maaf sistem sedang mengalami gangguan');
        }
    }

    /**
     * Get Biteship area ID for address lookup
     */
    private function getBiteshipAreaId($province, $city, $district)
    {
        try {
            $apiKey = env('BITESHIP_API_KEY');

            $searchQuery = $district . ', ' . $city . ', ' . $province;

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
            ])->get('https://api.biteship.com/v1/maps/areas', [
                'countries' => 'ID',
                'input' => $searchQuery,
                'type' => 'single'
            ]);

            $data = $response->json();

            if ($response->successful() && isset($data['areas']) && count($data['areas']) > 0) {
                return $data['areas'][0]['id'];
            }

            return null;

        } catch (\Exception $e) {
            \Log::warning('Biteship area lookup failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Process Biteship API rates and format for our system
     */
    private function processBiteshipRates($pricing)
    {
        $shippingOptions = [];

        foreach ($pricing as $rate) {
            // Only include JNE and J&T (check multiple possible names)
            $courierNameLower = strtolower($rate['courier_name']);
            if (!in_array($courierNameLower, ['jne', 'j&t express', 'jet', 'j&t', 'jnt', 'j&t express', 'jt express'])) {
                continue;
            }

            // Extract courier name
            $courierName = (in_array($courierNameLower, ['j&t express', 'jet', 'j&t', 'jnt', 'jt express'])) ? 'J&T' : 'JNE';

            // Determine if it's regular or next day service
            $serviceName = $rate['courier_service_name'];
            $serviceType = $this->determineServiceType($serviceName);

            // Calculate estimated delivery date
            $deliveryDate = $this->calculateDeliveryDate($rate['duration']);

            $shippingOptions[] = [
                'courier' => $courierName,
                'service' => $rate['courier_service_code'],
                'service_name' => $serviceType,
                'description' => $rate['description'] ?? $serviceName,
                'cost' => (int) $rate['price'],
                'estimated_delivery' => $deliveryDate,
                'delivery_days' => $this->extractDeliveryDays($rate['duration'])
            ];
        }

        // Filter to get Regular and Next Day options for JNE and J&T
        $filteredOptions = $this->filterShippingOptions($shippingOptions);

        if (empty($filteredOptions)) {
            throw new \Exception('Maaf sistem sedang mengalami gangguan');
        }

        return $filteredOptions;
    }

    /**
     * Determine service type from service name
     */
    private function determineServiceType($serviceName)
    {
        $serviceName = strtolower($serviceName);

        // Next Day / Express services
        if (strpos($serviceName, 'yes') !== false ||
            strpos($serviceName, 'next day') !== false ||
            strpos($serviceName, 'express') !== false ||
            strpos($serviceName, 'one day') !== false ||
            strpos($serviceName, 'same day') !== false ||
            strpos($serviceName, '1 day') !== false ||
            strpos($serviceName, 'overnight') !== false) {
            return 'Next Day';
        }

        // Regular services
        if (strpos($serviceName, 'reg') !== false ||
            strpos($serviceName, 'reguler') !== false ||
            strpos($serviceName, 'ez') !== false ||
            strpos($serviceName, 'economy') !== false ||
            strpos($serviceName, 'ekonomi') !== false) {
            return 'Reguler';
        }

        // Default fallback
        return 'Reguler';
    }

    /**
     * Filter shipping options to show Regular and Next Day for both couriers
     */
    private function filterShippingOptions($options)
    {
        $filtered = [];

        // Group by courier
        $jneOptions = array_filter($options, function($option) {
            return $option['courier'] === 'JNE';
        });

        $jntOptions = array_filter($options, function($option) {
            return $option['courier'] === 'J&T';
        });

        // Get Regular service for each courier
        $jneRegular = $this->findServiceType($jneOptions, 'Reguler');
        $jntRegular = $this->findServiceType($jntOptions, 'Reguler');

        // Get Next Day service for each courier
        $jneNextDay = $this->findServiceType($jneOptions, 'Next Day');
        $jntNextDay = $this->findServiceType($jntOptions, 'Next Day');

        // Add available options
        if ($jneRegular) $filtered[] = $jneRegular;
        if ($jntRegular) $filtered[] = $jntRegular;
        if ($jneNextDay) $filtered[] = $jneNextDay;
        if ($jntNextDay) $filtered[] = $jntNextDay;

        return $filtered;
    }

    /**
     * Find specific service type from options
     */
    private function findServiceType($options, $serviceType)
    {
        foreach ($options as $option) {
            if ($option['service_name'] === $serviceType) {
                return $option;
            }
        }
        return null;
    }

    /**
     * Calculate delivery date from duration string
     */
    private function calculateDeliveryDate($duration)
    {
        $days = $this->extractDeliveryDays($duration);
        return now()->addDays($days)->format('Y-m-d');
    }

    /**
     * Extract delivery days from duration string
     */
    private function extractDeliveryDays($duration)
    {
        // Duration format examples: "1-2 hari", "2-3 days", "1 hari"
        preg_match('/(\d+)/', $duration, $matches);
        return isset($matches[1]) ? (int) $matches[1] : 3; // Default 3 days
    }


}