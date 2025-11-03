<section class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <!-- Content -->
            <div class="order-2 lg:order-1">
                <div class="animate-fade-in">
                    <!-- Section Title -->
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                        {{ $section['title'] ?? 'About Us' }}
                    </h2>
                    
                    <!-- Subtitle -->
                    @if(isset($section['subtitle']) && $section['subtitle'])
                    <p class="text-xl text-gray-600 mb-6">
                        {{ $section['subtitle'] }}
                    </p>
                    @endif
                    
                    <!-- Content -->
                    <div class="prose prose-lg text-gray-700 mb-8">
                        @if(isset($section['content']) && $section['content'])
                            {!! nl2br(e($section['content'])) !!}
                        @else
                            <p>We are dedicated to providing excellent service and quality products to our customers. Our team is passionate about what we do and committed to delivering the best experience possible.</p>
                        @endif
                    </div>
                    
                    <!-- Stats/Highlights -->
                    @if(isset($section['stats']) && is_array($section['stats']))
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                        @foreach($section['stats'] as $stat)
                        <div class="text-center">
                            <div class="text-3xl font-bold text-blue-600 mb-2">
                                {{ $stat['number'] ?? '0' }}
                            </div>
                            <div class="text-sm text-gray-600">
                                {{ $stat['label'] ?? '' }}
                            </div>
                        </div>
                        @endforeach
                    </div>
                    @endif
                    
                    <!-- Call to Action -->
                    @if(isset($section['cta_text']) && isset($section['cta_link']))
                    <div class="flex flex-col sm:flex-row gap-4">
                        <a href="{{ $section['cta_link'] }}" class="btn-primary inline-flex items-center justify-center">
                            {{ $section['cta_text'] }}
                            <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                            </svg>
                        </a>
                        
                        @if(isset($section['secondary_cta_text']) && isset($section['secondary_cta_link']))
                        <a href="{{ $section['secondary_cta_link'] }}" class="btn-secondary inline-flex items-center justify-center">
                            {{ $section['secondary_cta_text'] }}
                        </a>
                        @endif
                    </div>
                    @endif
                </div>
            </div>
            
            <!-- Image -->
            <div class="order-1 lg:order-2">
                <div class="relative">
                    @if(isset($section['image']) && $section['image'])
                    <img src="{{ $section['image'] }}" alt="About Us" class="w-full h-96 lg:h-[500px] object-cover rounded-2xl shadow-2xl">
                    @else
                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="About Us" class="w-full h-96 lg:h-[500px] object-cover rounded-2xl shadow-2xl">
                    @endif
                    
                    <!-- Decorative Elements -->
                    <div class="absolute -top-4 -left-4 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-xl"></div>
                    <div class="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-xl"></div>
                </div>
            </div>
        </div>
        
        <!-- Additional Content Sections -->
        @if(isset($section['features']) && is_array($section['features']))
        <div class="mt-20">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                @foreach($section['features'] as $feature)
                <div class="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                    @if(isset($feature['icon']))
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <div class="w-6 h-6 text-blue-600">
                            {!! $feature['icon'] !!}
                        </div>
                    </div>
                    @endif
                    
                    <h3 class="text-xl font-semibold text-gray-900 mb-3">
                        {{ $feature['title'] ?? '' }}
                    </h3>
                    
                    <p class="text-gray-600">
                        {{ $feature['description'] ?? '' }}
                    </p>
                </div>
                @endforeach
            </div>
        </div>
        @endif
        
        <!-- Mission/Vision/Values -->
        @if(isset($section['mission']) || isset($section['vision']) || isset($section['values']))
        <div class="mt-20">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                @if(isset($section['mission']))
                <div class="text-center">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                    <p class="text-gray-600">{{ $section['mission'] }}</p>
                </div>
                @endif
                
                @if(isset($section['vision']))
                <div class="text-center">
                    <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                    <p class="text-gray-600">{{ $section['vision'] }}</p>
                </div>
                @endif
                
                @if(isset($section['values']))
                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">Our Values</h3>
                    <p class="text-gray-600">{{ $section['values'] }}</p>
                </div>
                @endif
            </div>
        </div>
        @endif
    </div>
</section>