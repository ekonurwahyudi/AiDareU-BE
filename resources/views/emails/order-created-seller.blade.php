<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pesanan Baru</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #4CAF50;
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px 20px;
        }
        .alert-box {
            background-color: #e8f5e9;
            border-left: 4px solid #4CAF50;
            padding: 15px;
            margin: 20px 0;
        }
        .order-number {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        .order-number strong {
            font-size: 18px;
            color: #4CAF50;
        }
        .info-table {
            width: 100%;
            margin: 20px 0;
            border-collapse: collapse;
        }
        .info-table th {
            background-color: #f8f9fa;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
        }
        .info-table td {
            padding: 10px;
            border-bottom: 1px solid #dee2e6;
        }
        .product-item {
            padding: 10px 0;
            border-bottom: 1px solid #dee2e6;
        }
        .product-item:last-child {
            border-bottom: none;
        }
        .total-section {
            background-color: #fff3e0;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }
        .total-row.grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #4CAF50;
            border-top: 2px solid #4CAF50;
            padding-top: 10px;
            margin-top: 10px;
        }
        .customer-info {
            background-color: #e3f2fd;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #2196F3;
        }
        .customer-info h3 {
            margin-top: 0;
            color: #1976D2;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #45a049;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Pesanan Baru!</h1>
        </div>

        <div class="content">
            <div class="alert-box">
                <strong>📢 Anda mendapat pesanan baru!</strong><br>
                Segera proses pesanan ini setelah pembayaran dikonfirmasi.
            </div>

            <div class="order-number">
                <div>Nomor Pesanan:</div>
                <strong>{{ $order->nomor_order }}</strong>
            </div>

            <h3>👤 Informasi Pembeli</h3>
            <div class="customer-info">
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 5px 0; width: 120px;"><strong>Nama:</strong></td>
                        <td style="padding: 5px 0;">{{ $order->customer->nama }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>No. HP:</strong></td>
                        <td style="padding: 5px 0;">{{ $order->customer->no_hp }}</td>
                    </tr>
                    @if($order->customer->email)
                    <tr>
                        <td style="padding: 5px 0;"><strong>Email:</strong></td>
                        <td style="padding: 5px 0;">{{ $order->customer->email }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td style="padding: 5px 0; vertical-align: top;"><strong>Alamat:</strong></td>
                        <td style="padding: 5px 0;">
                            {{ $order->customer->alamat }}<br>
                            {{ $order->customer->kecamatan }}, {{ $order->customer->kota }}<br>
                            {{ $order->customer->provinsi }}
                        </td>
                    </tr>
                </table>
            </div>

            <h3>📦 Detail Pesanan</h3>
            <table class="info-table">
                <tr>
                    <th>Tanggal Pesanan</th>
                    <td>{{ $order->created_at->format('d M Y H:i') }}</td>
                </tr>
                <tr>
                    <th>Status</th>
                    <td><span style="background-color: #fff3cd; padding: 5px 10px; border-radius: 3px;">Menunggu Pembayaran</span></td>
                </tr>
                <tr>
                    <th>Ekspedisi</th>
                    <td>{{ $order->ekspedisi }}</td>
                </tr>
                @if($order->estimasi_tiba)
                <tr>
                    <th>Estimasi Tiba</th>
                    <td>{{ $order->estimasi_tiba }}</td>
                </tr>
                @endif
                @if($order->bankAccount)
                <tr>
                    <th>Metode Pembayaran</th>
                    <td>Transfer {{ $order->bankAccount->bank_name }} - {{ $order->bankAccount->account_number }}</td>
                </tr>
                @endif
            </table>

            <h3>🛍️ Produk yang Dipesan</h3>
            @foreach($order->detailOrders as $detail)
            <div class="product-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>{{ $detail->product->nama_produk }}</strong><br>
                        @if($detail->variant_name && $detail->variant_option)
                        <small style="color: #6c757d; display: block; margin-top: 3px;">
                            {{ $detail->variant_name }}: {{ $detail->variant_option }}
                        </small>
                        @endif
                        <small style="color: #6c757d;">{{ $detail->quantity }}x Rp. {{ number_format($detail->price, 0, ',', '.') }}</small>
                    </div>
                    <div style="font-weight: bold;">
                        Rp. {{ number_format($detail->quantity * $detail->price, 0, ',', '.') }}
                    </div>
                </div>
            </div>
            @endforeach

            <div class="total-section">
                @php
                    $subtotal = $order->detailOrders->sum(function($detail) {
                        return $detail->quantity * $detail->price;
                    });

                    // Parse voucher data if exists
                    $voucherData = null;
                    $voucherDiscount = 0;
                    if ($order->voucher) {
                        $voucherData = is_string($order->voucher) ? json_decode($order->voucher, true) : $order->voucher;
                        $voucherDiscount = $voucherData['diskon_terapkan'] ?? 0;
                    }

                    $ongkir = ($order->total_harga + $voucherDiscount) - $subtotal;
                @endphp
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>Rp. {{ number_format($subtotal, 0, ',', '.') }}</span>
                </div>
                <div class="total-row">
                    <span>Ongkir:</span>
                    <span>Rp. {{ number_format($ongkir, 0, ',', '.') }}</span>
                </div>
                @if($voucherData && $voucherDiscount > 0)
                <div class="total-row" style="color: #16a34a;">
                    <span>Diskon Voucher ({{ $voucherData['kode_voucher'] ?? '' }}):</span>
                    <span>- Rp. {{ number_format($voucherDiscount, 0, ',', '.') }}</span>
                </div>
                @endif
                <div class="total-row grand-total">
                    <span>TOTAL PENDAPATAN:</span>
                    <span>Rp. {{ number_format($order->total_harga, 0, ',', '.') }}</span>
                </div>
            </div>

            <center>
                <a href="{{ $checkoutUrl }}" class="button">
                    👁️ Lihat Detail Pesanan
                </a>
            </center>

            <p style="margin-top: 30px; background-color: #fff9e6; padding: 15px; border-left: 4px solid #ffc107; border-radius: 3px;">
                <strong>💡 Langkah Selanjutnya:</strong><br>
                1. Tunggu pembeli melakukan pembayaran<br>
                2. Verifikasi pembayaran yang masuk<br>
                3. Proses dan kirim pesanan<br>
                4. Update status pengiriman
            </p>

            <p>Terima kasih,<br>
            <strong>Sistem AiDareU</strong></p>
        </div>

        <div class="footer">
            <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
            <p>© {{ date('Y') }} AiDareU. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
