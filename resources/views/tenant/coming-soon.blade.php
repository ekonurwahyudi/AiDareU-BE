@extends('tenant.layout')

@section('content')
<div class="min-h-screen flex items-center justify-center gradient-bg hero-pattern">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="animate-fade-in">
            <!-- Logo/Store Name -->
            <h1 class="text-6xl md:text-8xl font-bold text-white mb-6">
                {{ $store->name }}
            </h1>
            
            <!-- Coming Soon Message -->
            <h2 class="text-2xl md:text-4xl font-light text-white mb-8">
                Coming Soon
            </h2>
            
            <!-- Description -->
            <p class="text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
                We're working hard to bring you something amazing. 
                {{ $store->description ? $store->description . ' ' : '' }}
                Stay tuned for our official launch!
            </p>
            
            <!-- Contact Information -->
            @if($store->phone || $store->email)
            <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12 max-w-md mx-auto">
                <h3 class="text-xl font-semibold text-white mb-4">Get In Touch</h3>
                
                @if($store->phone)
                <div class="flex items-center justify-center mb-3">
                    <svg class="w-5 h-5 text-white mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                    <a href="tel:{{ $store->phone }}" class="text-white hover:text-white/80 transition-colors">
                        {{ $store->phone }}
                    </a>
                </div>
                @endif
                
                @if($store->email)
                <div class="flex items-center justify-center">
                    <svg class="w-5 h-5 text-white mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    <a href="mailto:{{ $store->email }}" class="text-white hover:text-white/80 transition-colors">
                        {{ $store->email }}
                    </a>
                </div>
                @endif
            </div>
            @endif
            
            <!-- Social Media Links -->
            @if($store->socialMedia && $store->socialMedia->count() > 0)
            <div class="mb-12">
                <h3 class="text-xl font-semibold text-white mb-6">Follow Us</h3>
                <div class="flex justify-center space-x-6">
                    @foreach($store->socialMedia as $social)
                        @if($social->url)
                        <a href="{{ $social->url }}" target="_blank" class="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all duration-200 hover:scale-110">
                            @switch($social->platform)
                                @case('facebook')
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    @break
                                @case('instagram')
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297z"/>
                                    </svg>
                                    @break
                                @case('tiktok')
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                    </svg>
                                    @break
                                @case('shopee')
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.506H6.106a.6.6 0 01-.6-.6V8.094a.6.6 0 01.6-.6h11.788a.6.6 0 01.6.6v7.812a.6.6 0 01-.6.6z"/>
                                    </svg>
                                    @break
                                @case('tokopedia')
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/>
                                    </svg>
                                    @break
                                @default
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.858-.896 3.605-2.068 4.777-1.172 1.172-2.92 1.899-4.777 2.068C9.33 15.135 8.179 15 7.2 14.4c-.979-.6-1.8-1.421-2.4-2.4-.6-.979-.735-2.13-.605-3.523.169-1.858.896-3.605 2.068-4.777C7.435 2.528 9.182 1.801 11.04 1.632c1.393-.13 2.544.005 3.523.605.979.6 1.8 1.421 2.4 2.4.6.979.735 2.13.605 3.523z"/>
                                    </svg>
                            @endswitch
                        </a>
                        @endif
                    @endforeach
                </div>
            </div>
            @endif
            
            <!-- Notify Me Button (Optional) -->
            <div class="space-y-4">
                <button class="bg-white text-gray-900 font-semibold py-4 px-8 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg">
                    Notify Me When We Launch
                </button>
                
                <p class="text-white/70 text-sm">
                    Be the first to know when we go live!
                </p>
            </div>
        </div>
    </div>
</div>

<!-- Floating particles animation -->
<div class="fixed inset-0 pointer-events-none overflow-hidden">
    <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-ping" style="animation-delay: 0s;"></div>
    <div class="absolute top-1/3 right-1/4 w-1 h-1 bg-white/30 rounded-full animate-ping" style="animation-delay: 1s;"></div>
    <div class="absolute bottom-1/4 left-1/3 w-3 h-3 bg-white/10 rounded-full animate-ping" style="animation-delay: 2s;"></div>
    <div class="absolute bottom-1/3 right-1/3 w-1 h-1 bg-white/25 rounded-full animate-ping" style="animation-delay: 3s;"></div>
</div>
@endsection

@push('styles')
<style>
    .animate-ping {
        animation: ping 4s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    
    @keyframes ping {
        75%, 100% {
            transform: scale(2);
            opacity: 0;
        }
    }
</style>
@endpush