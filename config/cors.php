<?php

return [
    // Apply CORS for API routes, Sanctum CSRF endpoint, and storage files
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    // Methods allowed
    'allowed_methods' => ['*'],

    // Explicit origins - Development and Production
    'allowed_origins' => [
        // Development
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:8080',
        // Railway deployment IPs
        'http://139.99.101.27:3000',
        'http://139.99.101.27:8080',
        // Production - allow both http and https for all domains
        'http://aidareu.com',
        'https://aidareu.com',
        'http://app.aidareu.com',
        'https://app.aidareu.com',
        'http://api.aidareu.com',
        'https://api.aidareu.com',
        'http://www.aidareu.com',
        'https://www.aidareu.com',
        // Custom domains for stores
        'https://aidareu.site',
        'http://aidareu.site',
    ],

    // Allow any subdomain patterns
    'allowed_origins_patterns' => [
        // Development - localhost
        '/^https?:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/i',
        '/^https?:\/\/127\.0\.0\.1(:\d+)?$/i',
        // Development - IP addresses
        '/^https?:\/\/\d+\.\d+\.\d+\.\d+(:\d+)?$/i',
        // Production - aidareu.com subdomains (allow both http and https)
        '/^https?:\/\/([a-z0-9-]+\.)?aidareu\.com$/i',
        // Custom domains for multi-tenant stores (any domain with any level of subdomains)
        '/^https?:\/\/([a-z0-9-]+\.)*[a-z0-9-]+\.[a-z]{2,}$/i',
        // Deployment platforms
        '/^https?:\/\/([a-z0-9-]+\.)?railway\.app$/i',
        '/^https?:\/\/([a-z0-9-]+\.)?vercel\.app$/i',
    ],

    // Headers
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Content-Disposition', 'Content-Type'],
    'max_age' => 86400,

    // Support credentials for auth endpoints
    'supports_credentials' => true,
];