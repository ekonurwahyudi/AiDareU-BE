<?php

return [
    // Apply CORS for API routes and Sanctum CSRF endpoint
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

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
        // Production
        'https://aidareu.com',
        'https://app.aidareu.com',
        'https://api.aidareu.com',
    ],

    // Allow any subdomain patterns
    'allowed_origins_patterns' => [
        // Development - localhost
        '/^https?:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/i',
        '/^https?:\/\/127\.0\.0\.1(:\d+)?$/i',
        // Production - aidareu.com subdomains
        '/^https:\/\/([a-z0-9-]+\.)?aidareu\.com$/i',
    ],

    // Headers
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,

    // Important for cookie-based auth (Sanctum): must be true when using credentials: 'include'
    'supports_credentials' => true,
];