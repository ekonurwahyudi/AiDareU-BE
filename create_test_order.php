<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\BankAccount;
use App\Models\Customer;
use App\Models\Order;

$userUuid = '3f35a968-ed45-454b-8773-9d57de0b186e';
$user = User::where('uuid', $userUuid)->first();
$store = Store::where('user_id', $user->uuid)->first();
$product = Product::first();

// Create bank account if not exists
$bankAccount = BankAccount::where('store_uuid', $store->uuid)->first();
if (!$bankAccount) {
    $bankAccount = BankAccount::create([
        'store_uuid' => $store->uuid,
        'bank_name' => 'BCA',
        'account_number' => '1234567890',
        'account_holder_name' => $store->name,
        'is_primary' => true
    ]);
}

// Create customer
$customer = Customer::firstOrCreate(
    ['email' => 'testorder@example.com'],
    [
        'nama' => 'Budi Santoso',
        'no_hp' => '08123456789',
        'alamat' => 'Jl. Sudirman No. 45',
        'provinsi' => 'DKI Jakarta',
        'kota' => 'Jakarta Pusat',
        'kecamatan' => 'Tanah Abang',
        'kode_pos' => '10220',
        'uuid_store' => $store->uuid
    ]
);

// Create order
$order = Order::create([
    'uuid_store' => $store->uuid,
    'uuid_customer' => $customer->uuid,
    'uuid_bank_account' => $bankAccount->uuid,
    'total_harga' => 250000,
    'ekspedisi' => 'JNE REG',
    'estimasi_tiba' => '2-3 hari',
    'status' => 'Pending'
]);

// Create detail order
$order->detailOrders()->create([
    'uuid_product' => $product->uuid,
    'quantity' => 2,
    'price' => 125000
]);

echo "✅ SUCCESS! Test order created!\n\n";
echo "Order Number: {$order->nomor_order}\n";
echo "Customer: {$customer->nama}\n";
echo "Product: {$product->nama_produk} x 2\n";
echo "Total: Rp " . number_format($order->total_harga, 0, ',', '.') . "\n";
echo "Status: {$order->status}\n\n";
echo "📱 TO TEST NOTIFICATION:\n";
echo "1. Open browser console (F12)\n";
echo "2. Run this command:\n";
echo "   localStorage.setItem(\"user_data\", JSON.stringify({uuid: \"{$userUuid}\", name: \"{$user->name}\", email: \"{$user->email}\"}))\n";
echo "3. Refresh page (F5)\n";
echo "4. Check notification bell icon - should show red dot with \"New Order\" notification!\n";
