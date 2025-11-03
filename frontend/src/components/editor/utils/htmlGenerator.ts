const COMPONENT_TYPES = {
  TEXT: 'text',
  DYNAMIC_TEXT: 'dynamic_text', 
  BUTTON: 'button',
  IMAGE: 'image',
  FULL_WIDTH_IMAGE: 'full_width_image',
  VIDEO: 'video',
  CONTAINER: 'container',
  GRID: 'grid',
  HTML_CODE: 'html_code',
  HERO_HEADER: 'hero_header',
  SPOTLIGHT_TEXT: 'spotlight_text',
  FEATURE_HIGHLIGHT: 'feature_highlight'
}

export const generateHTMLFromData = (components: any[], sections: any[]) => {
  // Combine components and sections into complete HTML
  const componentHTML = components.map(comp => {
    switch (comp.type) {
      case 'hero_header':
        return `<section class="hero-section relative min-h-screen flex items-center justify-center text-white" style="background: linear-gradient(135deg, rgba(0,0,0,0.6), rgba(37,99,235,0.3)), url(${comp.backgroundImage || 'https://source.unsplash.com/1600/600/?hero'}) center/cover;"><div class="container mx-auto px-4 text-center"><h1 class="text-5xl md:text-6xl font-bold mb-6">${comp.headline || 'Hero Headline'}</h1><p class="text-xl md:text-2xl mb-8">${comp.subheadline || 'Hero subheadline'}</p><a href="#contact" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg">${comp.ctaText || 'Call to Action'}</a></div></section>`
      case 'text':
        return `<div class="py-4"><p class="text-lg text-gray-600">${comp.content || 'Text content'}</p></div>`
      case 'dynamic_text':
        return `<div class="py-4"><h2 class="text-3xl font-bold text-gray-800">${comp.content || 'Dynamic Title'}</h2></div>`
      case 'button':
        return `<div class="py-4 text-center"><a href="${comp.url || '#'}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg">${comp.text || 'Button'}</a></div>`
      case 'image':
        return `<div class="py-4 text-center"><img src="${comp.src || 'https://source.unsplash.com/600/400/?image'}" alt="${comp.alt || 'Image'}" class="max-w-full h-auto rounded-lg shadow-lg mx-auto"/></div>`
      case 'html_content':
        return comp.content || '<div>HTML Content</div>'
      default:
        return `<div class="py-4"><!-- ${comp.type} component --></div>`
    }
  }).join('')

  // Add sections if available
  const sectionHTML = sections.map(section => {
    if (section.type === 'hero') {
      return `<section class="hero py-20 text-center"><h1 class="text-4xl font-bold mb-4">${section.title || ''}</h1><p class="text-xl mb-8">${section.subtitle || ''}</p>${section.image ? `<img src="${section.image}" class="mx-auto max-w-md rounded-lg"/>` : ''}</section>`
    }

    if (section.type === 'features') {
      return `<section class="features py-16"><div class="container mx-auto"><h2 class="text-3xl font-bold text-center mb-8">Features</h2><div class="grid md:grid-cols-3 gap-6">${(section.items || []).map((item: string) => `<div class="p-6 bg-white rounded-lg shadow"><p>${item}</p></div>`).join('')}</div></div></section>`
    }

    if (section.type === 'cta') {
      return `<section class="cta py-16 bg-blue-600 text-white text-center"><div class="container mx-auto"><h2 class="text-3xl font-bold">${section.text || 'Call to Action'}</h2></div></section>`
    }

    return ''
  }).join('')

  return componentHTML + sectionHTML
}

export const generateCSSFromData = (components: any[], sections: any[]) => {
  return `
    /* Base reset and typography */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    
    /* Typography */
    h1, h2, h3, h4, h5, h6 { font-weight: 700; color: #1f2937; }
    h1 { font-size: 2.25rem; margin-bottom: 1rem; }
    h2 { font-size: 1.875rem; margin-bottom: 0.875rem; }
    h3 { font-size: 1.5rem; margin-bottom: 0.75rem; }
    p { font-size: 1rem; color: #6b7280; margin-bottom: 1rem; line-height: 1.6; }
    
    /* Images */
    img { 
      max-width: 100%; 
      height: auto; 
      display: block; 
      border-radius: 8px;
    }
    
    /* Links and buttons */
    a {
      text-decoration: none;
      transition: all 0.3s ease;
    }
    
    a[style*="background"] {
      display: inline-block;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s;
    }
    
    a[style*="background"]:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    /* Layout utilities */
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    .hero-section { position: relative; }
    .text-center { text-align: center; }
    
    /* Spacing utilities */
    .py-4 { padding: 1rem 0; }
    .py-8 { padding: 2rem 0; }
    .py-16 { padding: 4rem 0; }
    .py-20 { padding: 5rem 0; }
    
    /* Text utilities */
    .text-lg { font-size: 1.125rem; }
    .text-xl { font-size: 1.25rem; }
    .text-3xl { font-size: 1.875rem; }
    .text-4xl { font-size: 2.25rem; }
    .text-5xl { font-size: 3rem; }
    .font-bold { font-weight: 700; }
    .text-gray-600 { color: #6b7280; }
    .text-gray-800 { color: #1f2937; }
    .text-white { color: white; }
    
    /* Background utilities */
    .bg-blue-600 { background-color: #2563eb; }
    .bg-white { background-color: white; }
    
    /* Border utilities */
    .rounded-lg { border-radius: 0.5rem; }
    
    /* Shadow utilities */
    .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .shadow-lg { box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    
    /* Size utilities */
    .max-w-full { max-width: 100%; }
    .h-auto { height: auto; }
    
    /* Margin utilities */
    .mx-auto { margin-left: auto; margin-right: auto; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    
    /* Grid utilities */
    .grid { display: grid; }
    .gap-2 { gap: 0.5rem; }
    .gap-6 { gap: 1.5rem; }
    
    /* Padding utilities */
    .p-6 { padding: 1.5rem; }
    
    /* Display utilities */
    .inline-block { display: inline-block; }
    
    /* Responsive utilities */
    @media (min-width: 768px) {
      .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
      .md\\:text-6xl { font-size: 3.75rem; }
      .md\\:text-2xl { font-size: 1.5rem; }
    }
  `
}

export const createComponentElement = (type: string): HTMLElement => {
  const div = document.createElement('div');

  div.className = 'editor-component';
  div.dataset.componentType = type;
  div.style.cssText = 'margin: 10px; padding: 15px; min-height: 60px; position: relative; display: inline-block; max-width: 100%; vertical-align: top;';
  
  // Add contenteditable attributes for text components
  const makeEditable = (element: HTMLElement) => {
    element.setAttribute('contenteditable', 'true');
    
    // Set appropriate placeholder based on element type
    const tag = element.tagName.toLowerCase();
    const placeholderText = tag === 'h1' || tag === 'h2' || tag === 'h3' ? 'Enter title...' : 
                          tag === 'button' ? 'Button text...' :
                          tag === 'a' ? 'Link text...' : 'Type here...';
    
    if (!element.textContent?.trim()) {
      element.setAttribute('data-placeholder', placeholderText);
    }
    
    // Add editor-only styling that won't be saved
    element.style.cursor = 'text';
    element.style.padding = '4px 6px';
    element.style.borderRadius = '4px';
    element.style.minWidth = '20px';
    element.style.display = 'inline-block';
    
    // Add focus and blur handlers for better UX
    element.addEventListener('focus', () => {
      element.style.outline = '2px solid #8b5cf6';
      element.style.outlineOffset = '2px';
      element.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
    });
    
    element.addEventListener('blur', () => {
      element.style.outline = 'none';
      element.style.backgroundColor = 'transparent';
      // Clean placeholder if element has content
      if (element.textContent?.trim()) {
        element.removeAttribute('data-placeholder');
      }
    });
    
    // Prevent drag and drop conflicts
    element.addEventListener('dragstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  };
  
  switch (type) {
    case COMPONENT_TYPES.TEXT:
      div.innerHTML = '<p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0;">Click to edit this text. You can add any content here and style it as needed.</p>';
      makeEditable(div.querySelector('p') || div);
      break;
    case COMPONENT_TYPES.DYNAMIC_TEXT:
      div.innerHTML = '<h2 style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">Dynamic Heading</h2><p style="color: #6b7280; margin: 0;">This is a subtitle that you can customize</p>';
      makeEditable(div.querySelector('h2') || div);
      makeEditable(div.querySelector('p') || div);
      break;
    case COMPONENT_TYPES.BUTTON:
      div.innerHTML = '<div style="text-align: center; margin: 0;"><a href="#" data-editable-link="true" style="display: inline-block; background: #3b82f6; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.2s; cursor: pointer;">Click Me</a></div>';
      // Make the button text editable
      const buttonLink = div.querySelector('a');
      if (buttonLink) {
        makeEditable(buttonLink);
      }
      break;
    case COMPONENT_TYPES.IMAGE:
      div.style.cssText = 'margin: 10px 0; padding: 0; min-height: 200px; position: relative; display: block; width: 100%;';
      div.innerHTML = '<img src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" alt="Click to replace image" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; cursor: pointer;" />';
      break;
    case COMPONENT_TYPES.FULL_WIDTH_IMAGE:
      div.style.cssText = 'margin: 20px 0; padding: 0; min-height: 300px; position: relative; display: block; width: 100%;';
      div.innerHTML = '<img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80" alt="Full width cover image" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; cursor: pointer;" />';
      break;
    case COMPONENT_TYPES.VIDEO:
      div.innerHTML = '<div style="text-align: center; padding: 20px; border: 2px dashed #e0e0e0; border-radius: 8px; background: #f3f4f6;"><div style="position: relative; width: 100%; height: 200px; background: #e5e7eb; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center;"><div style="font-size: 48px; color: #6b7280; margin-bottom: 10px;">▶️</div><div style="color: #6b7280; font-size: 16px; font-weight: 500;">Video Player</div><div style="color: #9ca3af; font-size: 14px; margin-top: 5px;">Click to add video URL</div></div></div>';
      break;
    case COMPONENT_TYPES.CONTAINER:
      div.innerHTML = '<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; text-align: center;"><h3 style="margin: 0 0 16px 0; color: #374151;">Container Section</h3><p style="margin: 0; color: #6b7280;">Drag other components into this container</p></div>';
      break;
    case COMPONENT_TYPES.GRID:
      div.innerHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;"><div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; color: #6b7280;">Column 1<br><small>Add content here</small></div><div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; color: #6b7280;">Column 2<br><small>Add content here</small></div></div>';
      break;
    case COMPONENT_TYPES.HERO_HEADER:
      div.style.margin = '0';
      div.style.padding = '80px 20px';
      div.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      div.style.color = 'white';
      div.style.textAlign = 'center';
      div.innerHTML = '<h1 style="font-size: 48px; font-weight: bold; margin: 0 0 20px 0;">Welcome to Our Service</h1><p style="font-size: 20px; margin: 0 0 30px 0; opacity: 0.9;">Transform your business with our amazing solutions</p><a href="#" style="display: inline-block; background: rgba(255,255,255,0.2); border: 2px solid white; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">Get Started</a>';
      makeEditable(div.querySelector('h1') || div);
      makeEditable(div.querySelector('p') || div);
      break;
    case 'contact_form':
      div.innerHTML = '<form style="max-width: 500px; margin: 0 auto;"><h3 style="margin: 0 0 20px 0; color: #374151;">Contact Us</h3><input type="text" placeholder="Your Name" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #d1d5db; border-radius: 6px;"/><input type="email" placeholder="Email Address" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #d1d5db; border-radius: 6px;"/><textarea placeholder="Your Message" rows="4" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #d1d5db; border-radius: 6px; resize: vertical;"></textarea><div style="display: flex; gap: 10px; margin-top: 15px;"><button type="submit" data-editable-link="true" style="flex: 1; background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Send Message</button><a href="https://wa.me/62812345678901?text=Hello, I want" data-editable-link="true" target="_blank" style="flex: 1; display: flex; align-items: center; justify-content: center; background: #25d366; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; cursor: pointer;">📱 WhatsApp</a></div></form>';
      // Make the title and buttons editable
      const formTitle = div.querySelector('h3');
      const submitButton = div.querySelector('button[type="submit"]');
      const whatsappButton = div.querySelector('a[href*="wa.me"]');
      if (formTitle) makeEditable(formTitle);
      if (submitButton) makeEditable(submitButton);
      if (whatsappButton) makeEditable(whatsappButton);
      break;
    case 'testimonial':
      div.innerHTML = '<div style="max-width: 600px; margin: 0 auto; text-align: center;"><div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><p style="font-size: 18px; font-style: italic; margin: 0 0 20px 0; color: #374151;">"This service completely transformed our business. Highly recommended!"</p><div style="display: flex; align-items: center; justify-content: center; gap: 15px;"><img src="https://source.unsplash.com/60x60/?portrait" alt="Customer" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;"/><div><strong style="color: #374151;">John Smith</strong><br/><span style="color: #6b7280; font-size: 14px;">CEO, Company Inc.</span></div></div></div></div>';
      makeEditable(div.querySelector('p') || div);
      makeEditable(div.querySelector('strong') || div);
      makeEditable(div.querySelector('span') || div);
      break;
    case 'pricing_card':
      div.innerHTML = '<div style="max-width: 350px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="background: #3b82f6; color: white; padding: 30px; text-align: center;"><h3 style="margin: 0 0 10px 0; font-size: 24px;">Pro Plan</h3><div class="price-text" style="font-size: 48px; font-weight: bold;">$29<span style="font-size: 18px; opacity: 0.8;">/month</span></div></div><div style="padding: 30px;"><ul style="list-style: none; padding: 0; margin: 0;"><li style="padding: 8px 0; color: #374151;">✓ All features included</li><li style="padding: 8px 0; color: #374151;">✓ 24/7 Support</li><li style="padding: 8px 0; color: #374151;">✓ Premium templates</li></ul><button data-editable-link="true" style="width: 100%; background: #3b82f6; color: white; padding: 15px; border: none; border-radius: 8px; font-weight: 600; margin-top: 20px; cursor: pointer;">Choose Plan</button></div></div>';
      makeEditable(div.querySelector('h3') || div);
      makeEditable(div.querySelector('.price-text') || div);
      makeEditable(div.querySelector('button') || div);
      // Make all li elements editable
      const listItems = div.querySelectorAll('li');
      listItems.forEach((li: any) => makeEditable(li));
      break;
    case 'divider':
      div.style.padding = '10px 0';
      div.innerHTML = '<hr style="border: none; height: 2px; background: linear-gradient(to right, transparent, #e5e7eb, transparent); margin: 20px 0;"/>';
      break;
    case 'spacer':
      div.innerHTML = '<div style="height: 60px; background: transparent; display: flex; align-items: center; justify-content: center; color: #9ca3af; border: 1px dashed #d1d5db; border-radius: 4px;"><small>Spacer - 60px height</small></div>';
      break;
    case 'stats':
      div.innerHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; text-align: center;"><div><div style="font-size: 48px; font-weight: bold; color: #3b82f6; margin-bottom: 8px;">100+</div><div style="color: #6b7280; font-size: 16px;">Happy Customers</div></div><div><div style="font-size: 48px; font-weight: bold; color: #10b981; margin-bottom: 8px;">5★</div><div style="color: #6b7280; font-size: 16px;">Average Rating</div></div><div><div style="font-size: 48px; font-weight: bold; color: #f59e0b; margin-bottom: 8px;">24/7</div><div style="color: #6b7280; font-size: 16px;">Support Available</div></div></div>';
      break;
    case 'features':
      div.innerHTML = '<div style="max-width: 1200px; margin: 0 auto;"><h2 style="text-align: center; font-size: 36px; font-weight: bold; color: #1f2937; margin-bottom: 50px;">Amazing Features</h2><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px;"><div style="text-align: center; padding: 20px;"><div style="font-size: 48px; margin-bottom: 20px;">🚀</div><h3 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 15px;">Fast Performance</h3><p style="color: #6b7280; line-height: 1.6;">Lightning fast loading times and optimized performance for the best user experience.</p></div><div style="text-align: center; padding: 20px;"><div style="font-size: 48px; margin-bottom: 20px;">🔒</div><h3 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 15px;">Secure & Safe</h3><p style="color: #6b7280; line-height: 1.6;">Enterprise-grade security with advanced encryption and protection.</p></div><div style="text-align: center; padding: 20px;"><div style="font-size: 48px; margin-bottom: 20px;">💎</div><h3 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 15px;">Premium Quality</h3><p style="color: #6b7280; line-height: 1.6;">High-quality service with attention to detail and premium support.</p></div></div></div>';
      makeEditable(div.querySelector('h2') || div);
      makeEditable(div.querySelectorAll('h3')[0] || div);
      makeEditable(div.querySelectorAll('h3')[1] || div);
      makeEditable(div.querySelectorAll('h3')[2] || div);
      makeEditable(div.querySelectorAll('p')[0] || div);
      makeEditable(div.querySelectorAll('p')[1] || div);
      makeEditable(div.querySelectorAll('p')[2] || div);
      break;
    case 'social_links':
      div.innerHTML = '<div style="text-align: center;"><h3 style="margin: 0 0 20px 0; color: #374151;">Follow Us</h3><div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;"><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: #1da1f2; color: white; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s;">📘</a><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: #1da1f2; color: white; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s;">🐦</a><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: #e4405f; color: white; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s;">📷</a><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: #0077b5; color: white; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s;">💼</a></div></div>';
      makeEditable(div.querySelector('h3') || div);
      break;
    case 'call_to_action':
      div.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      div.style.color = 'white';
      div.style.textAlign = 'center';
      div.style.padding = '60px 20px';
      div.style.margin = '40px 0';
      div.innerHTML = '<h2 style="font-size: 36px; font-weight: bold; margin: 0 0 20px 0;">Ready to Get Started?</h2><p style="font-size: 18px; margin: 0 0 30px 0; opacity: 0.9;">Join thousands of satisfied customers today</p><a href="#" style="display: inline-block; background: white; color: #667eea; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.2s;">Start Your Journey</a>';
      makeEditable(div.querySelector('h2') || div);
      makeEditable(div.querySelector('p') || div);
      break;
    case 'team_member':
      div.innerHTML = '<div style="max-width: 300px; margin: 0 auto; text-align: center; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><img src="https://source.unsplash.com/300x300/?professional" alt="Team Member" style="width: 100%; height: 250px; object-fit: cover;"/><div style="padding: 25px;"><h3 style="margin: 0 0 8px 0; font-size: 20px; color: #374151;">John Doe</h3><p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">Senior Developer</p><p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">Experienced developer with passion for creating amazing user experiences.</p></div></div>';
      makeEditable(div.querySelector('h3') || div);
      makeEditable(div.querySelectorAll('p')[0] || div);
      makeEditable(div.querySelectorAll('p')[1] || div);
      break;
    case 'faq':
      div.innerHTML = '<div style="max-width: 600px; margin: 0 auto;"><h3 style="margin: 0 0 30px 0; text-align: center; color: #374151;">Frequently Asked Questions</h3><div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;"><div style="border-bottom: 1px solid #e5e7eb; padding: 20px; background: #f9fafb;"><strong style="color: #374151;">How does it work?</strong><p style="margin: 10px 0 0 0; color: #6b7280;">Our service is designed to be simple and effective. Just sign up, customize your preferences, and start enjoying the benefits.</p></div><div style="border-bottom: 1px solid #e5e7eb; padding: 20px;"><strong style="color: #374151;">Is there a free trial?</strong><p style="margin: 10px 0 0 0; color: #6b7280;">Yes! We offer a 14-day free trial with no credit card required. You can explore all features during this period.</p></div><div style="padding: 20px; background: #f9fafb;"><strong style="color: #374151;">Can I cancel anytime?</strong><p style="margin: 10px 0 0 0; color: #6b7280;">Absolutely. You can cancel your subscription at any time without any penalties or hidden fees.</p></div></div></div>';
      makeEditable(div.querySelector('h3') || div);
      makeEditable(div.querySelectorAll('strong')[0] || div);
      makeEditable(div.querySelectorAll('strong')[1] || div);
      makeEditable(div.querySelectorAll('strong')[2] || div);
      makeEditable(div.querySelectorAll('p')[0] || div);
      makeEditable(div.querySelectorAll('p')[1] || div);
      makeEditable(div.querySelectorAll('p')[2] || div);
      break;
    case 'newsletter':
      div.innerHTML = '<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; text-align: center; max-width: 500px; margin: 0 auto;"><h3 style="margin: 0 0 15px 0; color: #374151; font-size: 24px;">Stay Updated</h3><p style="margin: 0 0 25px 0; color: #6b7280;">Subscribe to our newsletter for the latest updates and exclusive offers.</p><div style="display: flex; gap: 10px; max-width: 400px; margin: 0 auto;"><input type="email" placeholder="Enter your email" style="flex: 1; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"/><button style="background: #3b82f6; color: white; padding: 12px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap;">Subscribe</button></div></div>';
      makeEditable(div.querySelector('h3') || div);
      makeEditable(div.querySelector('p') || div);
      break;
    default:
      div.innerHTML = `<div style="text-align: center; color: #6b7280;"><strong>${type.replace(/_/g, ' ').toUpperCase()}</strong><br><small>Component added successfully</small></div>`;
  }
  
  return div;
}

export const getDefaultProps = (type: string) => {
  switch (type) {
    case COMPONENT_TYPES.TEXT:
      return { content: 'Edit this text...' }
    case COMPONENT_TYPES.DYNAMIC_TEXT:
      return { content: 'Dynamic Title' }
    case COMPONENT_TYPES.BUTTON:
      return { text: 'Button', url: '#', color: 'primary', size: 'medium' }
    case COMPONENT_TYPES.IMAGE:
      return { src: 'https://source.unsplash.com/400x300/?business', alt: 'Image' }
    case COMPONENT_TYPES.HERO_HEADER:
      return { 
        headline: 'Welcome to Our Service',
        subheadline: 'Transform your business with our solutions',
        ctaText: 'Get Started',
        backgroundImage: 'https://source.unsplash.com/1600x600/?business,modern'
      }
    case 'html_content':
      return { 
        content: '<div style="padding: 20px; text-align: center; border: 1px solid #e0e0e0; border-radius: 8px;"><h2>HTML Content Block</h2><p>You can edit this HTML content directly to customize your landing page.</p></div>' 
      }
    case 'divider':
      return { style: 'solid', color: '#e5e7eb', thickness: '1px' }
    case 'spacer':
      return { height: '50px' }
    case 'contact_form':
      return { title: 'Contact Us', fields: ['name', 'email', 'message'] }
    case 'testimonial':
      return { name: 'John Doe', text: 'Amazing service!', rating: 5 }
    case 'pricing_card':
      return { title: 'Basic Plan', price: '$29', features: ['Feature 1', 'Feature 2'] }
    case 'team_member':
      return { name: 'Team Member', role: 'Position', image: 'https://source.unsplash.com/200x200/?person' }
    case 'faq':
      return { question: 'Frequently Asked Question?', answer: 'Answer goes here' }
    case 'newsletter':
      return { title: 'Subscribe Newsletter', placeholder: 'Enter your email' }
    case 'stats':
      return { title: '1000+', subtitle: 'Happy Customers' }
    case 'features':
      return { title: 'Features Grid', items: ['Feature 1', 'Feature 2', 'Feature 3'] }
    case 'social_links':
      return { platforms: ['facebook', 'twitter', 'instagram'] }
    case 'call_to_action':
      return { title: 'Ready to get started?', button: 'Get Started Now' }
    default:
      return {}
  }
}

// Function to clean editor-specific styling for view page
export const cleanHtmlForViewing = (html: string): string => {
  // Create a temporary DOM to properly clean the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove all editor-specific elements
  tempDiv.querySelectorAll('.ve-resize-handle, .ve-drag-handle, .element-controls').forEach(el => el.remove());
  
  // Clean up all elements
  tempDiv.querySelectorAll('*').forEach(el => {
    const element = el as HTMLElement;
    
    // Remove editor-specific attributes
    element.removeAttribute('contenteditable');
    element.removeAttribute('data-placeholder');
    element.removeAttribute('data-component-type');
    element.removeAttribute('data-component-id');
    element.removeAttribute('draggable');
    
    // Remove editor-specific classes
    element.classList.remove('editor-component', 'selected-element');
    
    // Clean up style attribute - remove editor-specific styles
    if (element.style) {
      element.style.removeProperty('outline');
      element.style.removeProperty('outline-offset');
      element.style.removeProperty('opacity');
      element.style.removeProperty('cursor');
      
      // Remove background-color if it's the editor selection color
      const bgColor = element.style.backgroundColor;
      if (bgColor && (bgColor.includes('139, 92, 246') || bgColor.includes('rgba(139, 92, 246'))) {
        element.style.removeProperty('background-color');
      }
      
      // Remove empty style attribute
      if (element.getAttribute('style') === '' || element.getAttribute('style') === null) {
        element.removeAttribute('style');
      }
    }
    
    // Remove empty class attribute
    if (element.className === '' || element.className === null) {
      element.removeAttribute('class');
    }
  });
  
  return tempDiv.innerHTML
    // Additional cleanup with regex for any missed cases
    .replace(/\s+data-[^=]*="[^"]*"/g, '') // Remove any remaining data attributes
    .replace(/\s+contenteditable="[^"]*"/g, '') // Remove contenteditable
    .replace(/\s+draggable="[^"]*"/g, '') // Remove draggable
    .replace(/\s+class="\s*"/g, '') // Remove empty class attributes
    .replace(/\s+style="\s*"/g, '') // Remove empty style attributes
    // Clean up extra spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}