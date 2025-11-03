<section class="relative min-h-screen flex items-center justify-center overflow-hidden">
    <!-- Background Image -->
    @if(isset($section['background_image']) && $section['background_image'])
    <div class="absolute inset-0 z-0">
        <img src="{{ $section['background_image'] }}" alt="Hero Background" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-black/50"></div>
    </div>
    @else
    <div class="absolute inset-0 z-0 gradient-bg hero-pattern"></div>
    @endif
    
    <!-- Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="animate-fade-in">
            <!-- Main Title -->
            <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                {{ $section['title'] ?? $store->name }}
            </h1>
            
            <!-- Subtitle -->
            @if(isset($section['subtitle']) && $section['subtitle'])
            <p class="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                {{ $section['subtitle'] }}
            </p>
            @endif
            
            <!-- Description -->
            @if(isset($section['description']) && $section['description'])
            <p class="text-lg text-white/80 mb-12 max-w-2xl mx-auto">
                {{ $section['description'] }}
            </p>
            @endif
            
            <!-- Call to Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                @if(isset($section['cta_text']) && isset($section['cta_link']))
                <a href="{{ $section['cta_link'] }}" class="btn-primary inline-flex items-center">
                    {{ $section['cta_text'] }}
                    <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                </a>
                @endif
                
                @if(isset($section['secondary_cta_text']) && isset($section['secondary_cta_link']))
                <a href="{{ $section['secondary_cta_link'] }}" class="btn-secondary inline-flex items-center">
                    {{ $section['secondary_cta_text'] }}
                </a>
                @endif
            </div>
            
            <!-- Features/Benefits -->
            @if(isset($section['features']) && is_array($section['features']))
            <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                @foreach($section['features'] as $feature)
                <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                    @if(isset($feature['icon']))
                    <div class="w-12 h-12 mx-auto mb-4 text-white">
                        {!! $feature['icon'] !!}
                    </div>
                    @endif
                    
                    <h3 class="text-lg font-semibold text-white mb-2">
                        {{ $feature['title'] ?? '' }}
                    </h3>
                    
                    <p class="text-white/80 text-sm">
                        {{ $feature['description'] ?? '' }}
                    </p>
                </div>
                @endforeach
            </div>
            @endif
        </div>
    </div>
    
    <!-- Scroll Down Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div class="animate-bounce">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
        </div>
    </div>
</section>