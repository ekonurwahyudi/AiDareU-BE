<?php

return [
    // Apply CORS for API routes and Sanctum CSRF endpoint
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Methods allowed
    'allowed_methods' => ['*'],

    // Explicit origins (kept for reference); use patterns to allow subdomains like slug.localhost:3000
    'allowed_origins' => ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:8080'],

    // Allow any subdomain of localhost on any port (e.g., coffee.localhost:3000)
    'allowed_origins_patterns' => ['/^https?:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/i', '/^https?:\/\/127\.0\.0\.1(:\d+)?$/i'],

    // Headers
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,

    // Important for cookie-based auth (Sanctum): must be true when using credentials: 'include'
    'supports_credentials' => true,
];