<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Konfirmasi Pesanan</title>
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
            background-color: #E91E63;
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
        .success-icon {
            text-align: center;
            font-size: 60px;
            margin-bottom: 20px;
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
            color: #E91E63;
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
            color: #E91E63;
            border-top: 2px solid #E91E63;
            padding-top: 10px;
            margin-top: 10px;
        }
        .payment-info {
            background-color: #e3f2fd;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #2196F3;
        }
        .payment-info h3 {
            margin-top: 0;
            color: #1976D2;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #E91E63;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #C2185B;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
        .note {
            background-color: #fff9e6;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Pesanan Berhasil!</h1>
        </div>

        <div class="content">
            <p>Halo <strong>{{ $order->customer->nama }}</strong>,</p>

            <p>Terima kasih atas pesanan Anda! Pesanan Anda telah berhasil dibuat dan menunggu pembayaran.</p>

            <div class="order-number">
                <div>Nomor Pesanan:</div>
                <strong>{{ $order->nomor_order }}</strong>
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
                    $ongkir = $order->total_harga - $subtotal;
                @endphp
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>Rp. {{ number_format($subtotal, 0, ',', '.') }}</span>
                </div>
                <div class="total-row">
                    <span>Ongkir:</span>
                    <span>Rp. {{ number_format($ongkir, 0, ',', '.') }}</span>
                </div>
                <div class="total-row grand-total">
                    <span>TOTAL PEMBAYARAN:</span>
                    <span>Rp. {{ number_format($order->total_harga, 0, ',', '.') }}</span>
                </div>
            </div>

            @if($order->bankAccount)
            <div class="payment-info">
                <h3>💳 Informasi Pembayaran</h3>
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 5px 0;"><strong>Bank:</strong></td>
                        <td style="padding: 5px 0;">{{ $order->bankAccount->bank_name ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>No. Rekening:</strong></td>
                        <td style="padding: 5px 0; font-size: 16px; font-weight: bold;">{{ $order->bankAccount->account_number ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Atas Nama:</strong></td>
                        <td style="padding: 5px 0;">{{ $order->bankAccount->account_holder_name ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Jumlah Transfer:</strong></td>
                        <td style="padding: 5px 0; font-size: 18px; font-weight: bold; color: #E91E63;">Rp. {{ number_format($order->total_harga, 0, ',', '.') }}</td>
                    </tr>
                </table>
            </div>
            @else
            <div class="payment-info">
                <h3>💳 Informasi Pembayaran</h3>
                <p style="color: #f44336; margin: 10px 0;">⚠️ Informasi rekening bank belum tersedia. Silakan hubungi penjual untuk informasi pembayaran.</p>
            </div>
            @endif

            <div class="note">
                <strong>⚠️ Penting:</strong><br>
                • Silakan transfer sesuai dengan jumlah yang tertera di atas<br>
                • Konfirmasi pembayaran melalui link di bawah ini setelah melakukan transfer<br>
                • Pesanan akan diproses setelah pembayaran dikonfirmasi
            </div>

            <center>
                <a href="{{ $checkoutUrl }}" class="button">
                    👁️ Lihat Invoice & Konfirmasi Pembayaran
                </a>
            </center>

            <p style="margin-top: 30px;">Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi kami.</p>

            <p>Terima kasih,<br>
            <strong>{{ $order->store->name }}</strong></p>
        </div>

        <div class="footer">
            <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
            <p>© {{ date('Y') }} {{ $order->store->name }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
