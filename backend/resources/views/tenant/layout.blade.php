<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $meta['title'] ?? $store->name }}</title>
    <meta name="description" content="{{ $meta['description'] ?? $store->description }}">
    <meta name="keywords" content="{{ $meta['keywords'] ?? '' }}">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="{{ $meta['title'] ?? $store->name }}">
    <meta property="og:description" content="{{ $meta['description'] ?? $store->description }}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ request()->url() }}">
    @if(isset($meta['og_image']) && $meta['og_image'])
    <meta property="og:image" content="{{ $meta['og_image'] }}">
    @endif
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $meta['title'] ?? $store->name }}">
    <meta name="twitter:description" content="{{ $meta['description'] ?? $store->description }}">
    @if(isset($meta['og_image']) && $meta['og_image'])
    <meta name="twitter:image" content="{{ $meta['og_image'] }}">
    @endif
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    
    <!-- TailwindCSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Custom CSS -->
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .hero-pattern {
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .animate-fade-in {
            animation: fadeIn 0.8s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .btn-primary {
            @apply bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl;
        }
        
        .btn-secondary {
            @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200;
        }
    </style>
    
    @stack('styles')
</head>
<body class="bg-gray-50 text-gray-900">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-50">
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <!-- Logo -->
                <div class="flex-shrink-0">
                    <a href="/" class="text-2xl font-bold text-gray-900">
                        {{ $store->name }}
                    </a>
                </div>
                
                <!-- Navigation -->
                <div class="hidden md:block">
                    <div class="ml-10 flex items-baseline space-x-4">
                        <a href="/" class="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</a>
                        <a href="/about" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">About</a>
                        <a href="/products" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Products</a>
                        <a href="/contact" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Contact</a>
                    </div>
                </div>
                
                <!-- Mobile menu button -->
                <div class="md:hidden">
                    <button type="button" class="mobile-menu-button bg-gray-200 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                        <span class="sr-only">Open main menu</span>
                        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Mobile menu -->
            <div class="mobile-menu hidden md:hidden">
                <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                    <a href="/" class="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">Home</a>
                    <a href="/about" class="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">About</a>
                    <a href="/products" class="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">Products</a>
                    <a href="/contact" class="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">Contact</a>
                </div>
            </div>
        </nav>
    </header>
    
    <!-- Main Content -->
    <main>
        @yield('content')
    </main>
    
    <!-- Footer -->
    <footer class="bg-gray-900 text-white">
        <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <!-- Company Info -->
                <div class="col-span-1 md:col-span-2">
                    <h3 class="text-2xl font-bold mb-4">{{ $store->name }}</h3>
                    <p class="text-gray-300 mb-4">{{ $store->description }}</p>
                    
                    @if($store->phone)
                    <p class="text-gray-300 mb-2">
                        <span class="font-semibold">Phone:</span> {{ $store->phone }}
                    </p>
                    @endif
                    
                    @if($store->email)
                    <p class="text-gray-300 mb-2">
                        <span class="font-semibold">Email:</span> {{ $store->email }}
                    </p>
                    @endif
                    
                    @if($store->address)
                    <p class="text-gray-300">
                        <span class="font-semibold">Address:</span> {{ $store->address }}
                    </p>
                    @endif
                </div>
                
                <!-- Quick Links -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">Quick Links</h4>
                    <ul class="space-y-2">
                        <li><a href="/" class="text-gray-300 hover:text-white transition-colors">Home</a></li>
                        <li><a href="/about" class="text-gray-300 hover:text-white transition-colors">About</a></li>
                        <li><a href="/products" class="text-gray-300 hover:text-white transition-colors">Products</a></li>
                        <li><a href="/contact" class="text-gray-300 hover:text-white transition-colors">Contact</a></li>
                    </ul>
                </div>
                
                <!-- Social Media -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">Follow Us</h4>
                    <div class="flex space-x-4">
                        @foreach($store->socialMedia as $social)
                            @if($social->url)
                            <a href="{{ $social->url }}" target="_blank" class="text-gray-300 hover:text-white transition-colors">
                                @switch($social->platform)
                                    @case('facebook')
                                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                        @break
                                    @case('instagram')
                                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297z"/></svg>
                                        @break
                                    @case('tiktok')
                                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                                        @break
                                    @default
                                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.858-.896 3.605-2.068 4.777-1.172 1.172-2.92 1.899-4.777 2.068C9.33 15.135 8.179 15 7.2 14.4c-.979-.6-1.8-1.421-2.4-2.4-.6-.979-.735-2.13-.605-3.523.169-1.858.896-3.605 2.068-4.777C7.435 2.528 9.182 1.801 11.04 1.632c1.393-.13 2.544.005 3.523.605.979.6 1.8 1.421 2.4 2.4.6.979.735 2.13.605 3.523z"/></svg>
                                @endswitch
                            </a>
                            @endif
                        @endforeach
                    </div>
                </div>
            </div>
            
            <div class="mt-8 pt-8 border-t border-gray-700 text-center">
                <p class="text-gray-300">&copy; {{ date('Y') }} {{ $store->name }}. All rights reserved.</p>
            </div>
        </div>
    </footer>
    
    <!-- JavaScript -->
    <script>
        // Mobile menu toggle
        document.addEventListener('DOMContentLoaded', function() {
            const mobileMenuButton = document.querySelector('.mobile-menu-button');
            const mobileMenu = document.querySelector('.mobile-menu');
            
            if (mobileMenuButton && mobileMenu) {
                mobileMenuButton.addEventListener('click', function() {
                    mobileMenu.classList.toggle('hidden');
                });
            }
        });
    </script>
    
    @stack('scripts')
</body>
</html>