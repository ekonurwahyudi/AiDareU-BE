@extends('tenant.layout')

@section('content')
<div class="min-h-screen">
    @if(isset($content) && is_array($content))
        @foreach($content as $section)
            @if(isset($section['type']))
                @switch($section['type'])
                    @case('hero')
                        @include('tenant.sections.hero', ['section' => $section])
                        @break
                    
                    @case('about')
                        @include('tenant.sections.about', ['section' => $section])
                        @break
                    
                    @case('services')
                        @include('tenant.sections.services', ['section' => $section])
                        @break
                    
                    @case('testimonials')
                        @include('tenant.sections.testimonials', ['section' => $section])
                        @break
                    
                    @case('contact')
                        @include('tenant.sections.contact', ['section' => $section])
                        @break
                    
                    @case('gallery')
                        @include('tenant.sections.gallery', ['section' => $section])
                        @break
                    
                    @case('features')
                        @include('tenant.sections.features', ['section' => $section])
                        @break
                    
                    @case('pricing')
                        @include('tenant.sections.pricing', ['section' => $section])
                        @break
                    
                    @case('team')
                        @include('tenant.sections.team', ['section' => $section])
                        @break
                    
                    @case('faq')
                        @include('tenant.sections.faq', ['section' => $section])
                        @break
                    
                    @case('cta')
                        @include('tenant.sections.cta', ['section' => $section])
                        @break
                    
                    @default
                        @include('tenant.sections.custom', ['section' => $section])
                @endswitch
            @endif
        @endforeach
    @else
        <!-- Default landing page if no content is available -->
        @include('tenant.sections.hero', [
            'section' => [
                'title' => $store->name,
                'subtitle' => $store->description ?? 'Welcome to our store',
                'cta_text' => 'Get Started',
                'cta_link' => '/contact',
                'background_image' => 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
            ]
        ])
        
        @include('tenant.sections.about', [
            'section' => [
                'title' => 'About Us',
                'content' => $store->description ?? 'We are dedicated to providing excellent service and quality products to our customers.',
                'image' => 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ]
        ])
        
        @include('tenant.sections.contact', [
            'section' => [
                'title' => 'Get In Touch',
                'subtitle' => 'We would love to hear from you',
                'phone' => $store->phone,
                'email' => $store->email,
                'address' => $store->address
            ]
        ])
    @endif
</div>
@endsection