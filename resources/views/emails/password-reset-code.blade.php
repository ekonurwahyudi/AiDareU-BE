<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode Reset Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #f0f0f0;
        }
        .content {
            padding: 30px 0;
        }
        .reset-code {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #dc3545;
            letter-spacing: 8px;
            margin: 10px 0;
        }
        .footer {
            border-top: 2px solid #f0f0f0;
            padding: 20px 0;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .security-notice {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ config('app.name') }}</h1>
        <h2>Reset Password</h2>
    </div>

    <div class="content">
        <p>Halo,</p>
        
        <p>Kami menerima permintaan untuk mereset password akun Anda. Silakan gunakan kode berikut untuk melanjutkan proses reset password:</p>

        <div class="reset-code">
            <p>Kode Reset Password:</p>
            <div class="code">{{ $resetCode }}</div>
            <p><small>Kode ini berlaku selama 15 menit</small></p>
        </div>

        <p>Masukkan kode ini pada halaman reset password untuk membuat password baru.</p>

        <div class="security-notice">
            <strong>Keamanan Akun:</strong> Jika Anda tidak meminta reset password ini, abaikan email ini dan password Anda tetap aman.
        </div>

        <div class="warning">
            <strong>Penting:</strong> Kode reset ini bersifat rahasia. Jangan berikan kepada siapa pun. Tim {{ config('app.name') }} tidak akan pernah meminta kode ini melalui telepon atau email.
        </div>
    </div>

    <div class="footer">
        <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
        <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
    </div>
</body>
</html>