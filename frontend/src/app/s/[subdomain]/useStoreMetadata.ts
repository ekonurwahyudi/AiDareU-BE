'use client'

import { useEffect } from 'react'

interface MetadataOptions {
  title?: string
  description?: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  favicon?: string
}

export function useStoreMetadata(options: MetadataOptions) {
  useEffect(() => {
    // Defer metadata updates to avoid blocking navigation
    const timeoutId = setTimeout(() => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      // Update document title
      if (options.title) {
        document.title = options.title
      }

      // Update favicon (only once, check if already exists)
      if (options.favicon) {
        const faviconUrl = options.favicon.startsWith('http')
          ? options.favicon
          : `${backendUrl}/storage/${options.favicon}`

        let existingFavicon = document.querySelector("link[rel='icon']") as HTMLLinkElement

        if (!existingFavicon) {
          existingFavicon = document.createElement('link')
          existingFavicon.rel = 'icon'
          existingFavicon.type = 'image/x-icon'
          document.head.appendChild(existingFavicon)
        }
        existingFavicon.href = faviconUrl
      }

      // Update meta description
      if (options.description) {
        updateMetaTag('description', options.description)
      }

      // Update meta keywords
      if (options.keywords) {
        updateMetaTag('keywords', options.keywords)
      }

      // Open Graph tags
      if (options.ogTitle) {
        updateMetaTag('og:title', options.ogTitle, 'property')
      }

      if (options.ogDescription) {
        updateMetaTag('og:description', options.ogDescription, 'property')
      }

      if (options.ogImage) {
        const ogImageUrl = options.ogImage.startsWith('http')
          ? options.ogImage
          : `${backendUrl}/storage/${options.ogImage}`

        updateMetaTag('og:image', ogImageUrl, 'property')
        updateMetaTag('og:image:width', '1200', 'property')
        updateMetaTag('og:image:height', '630', 'property')
      }

      updateMetaTag('og:type', 'website', 'property')

      // Twitter Card tags
      updateMetaTag('twitter:card', 'summary_large_image', 'name')
      if (options.ogTitle) {
        updateMetaTag('twitter:title', options.ogTitle, 'name')
      }
      if (options.ogDescription) {
        updateMetaTag('twitter:description', options.ogDescription, 'name')
      }
      if (options.ogImage) {
        const ogImageUrl = options.ogImage.startsWith('http')
          ? options.ogImage
          : `${backendUrl}/storage/${options.ogImage}`
        updateMetaTag('twitter:image', ogImageUrl, 'name')
      }

      // Additional SEO tags
      updateMetaTag('robots', 'index, follow', 'name')
      updateMetaTag('viewport', 'width=device-width, initial-scale=1.0', 'name')
    }, 0) // Defer to next tick to avoid blocking

    return () => clearTimeout(timeoutId)
  }, [options.title, options.description, options.keywords, options.ogTitle, options.ogDescription, options.ogImage, options.favicon])
}

// Helper function to update or create meta tags
function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  if (!content) return

  let element = document.querySelector(`meta[${attribute}="${name}"]`)

  if (element) {
    element.setAttribute('content', content)
  } else {
    const meta = document.createElement('meta')
    meta.setAttribute(attribute, name)
    meta.setAttribute('content', content)
    document.head.appendChild(meta)
  }
}
