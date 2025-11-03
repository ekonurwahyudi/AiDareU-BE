'use client'

import { useEffect, useState } from 'react'
import Head from 'next/head'

interface DynamicMetadataProps {
  subdomain: string
}

export default function DynamicMetadata({ subdomain }: DynamicMetadataProps) {
  const [storeData, setStoreData] = useState<any>(null)

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/api/store/${subdomain}`, {
          cache: 'no-store'
        })
        const data = await response.json()

        if (data.success && data.data) {
          setStoreData(data.data)

          // Get SEO and Settings data
          const seo = data.data.seo
          const settings = data.data.settings
          const store = data.data.store

          // Update document title
          const siteTitle = settings?.site_title || store?.name || 'AiDareU Store'
          const siteTagline = settings?.site_tagline || ''
          const metaTitle = seo?.meta_title || (siteTagline ? `${siteTitle} - ${siteTagline}` : siteTitle)
          document.title = metaTitle

          // Update favicon
          if (settings?.favicon) {
            const faviconUrl = `${backendUrl}/storage/${settings.favicon}`

            // Remove existing favicons
            const existingFavicons = document.querySelectorAll("link[rel*='icon']")
            existingFavicons.forEach(icon => icon.remove())

            // Add new favicon
            const link = document.createElement('link')
            link.rel = 'icon'
            link.type = 'image/x-icon'
            link.href = faviconUrl
            document.head.appendChild(link)

            // Add apple touch icon
            const appleTouchIcon = document.createElement('link')
            appleTouchIcon.rel = 'apple-touch-icon'
            appleTouchIcon.href = faviconUrl
            document.head.appendChild(appleTouchIcon)

            // Add shortcut icon
            const shortcutIcon = document.createElement('link')
            shortcutIcon.rel = 'shortcut icon'
            shortcutIcon.href = faviconUrl
            document.head.appendChild(shortcutIcon)
          }

          // Update meta tags for SEO (from seo_toko table)
          const metaDescription = seo?.deskripsi || `Discover amazing products at ${siteTitle}`
          const metaKeywords = seo?.keyword || ''

          updateMetaTag('description', metaDescription)
          updateMetaTag('keywords', metaKeywords)

          // Open Graph tags (from seo_toko table)
          const ogTitle = seo?.og_title || metaTitle
          const ogDescription = seo?.og_deskripsi || metaDescription
          const ogImage = seo?.og_image || settings?.logo

          updateMetaTag('og:title', ogTitle, 'property')
          updateMetaTag('og:description', ogDescription, 'property')
          updateMetaTag('og:type', 'website', 'property')
          updateMetaTag('og:site_name', siteTitle, 'property')

          if (ogImage) {
            updateMetaTag('og:image', `${backendUrl}/storage/${ogImage}`, 'property')
            updateMetaTag('og:image:width', '1200', 'property')
            updateMetaTag('og:image:height', '630', 'property')
          }

          // Twitter Card tags
          updateMetaTag('twitter:card', 'summary_large_image', 'name')
          updateMetaTag('twitter:title', ogTitle, 'name')
          updateMetaTag('twitter:description', ogDescription, 'name')

          if (ogImage) {
            updateMetaTag('twitter:image', `${backendUrl}/storage/${ogImage}`, 'name')
          }

          // Additional SEO tags
          updateMetaTag('robots', 'index, follow', 'name')
          updateMetaTag('author', siteTitle, 'name')
          updateMetaTag('viewport', 'width=device-width, initial-scale=1.0', 'name')
        }
      } catch (error) {
        console.error('Error fetching store data for metadata:', error)
      }
    }

    if (subdomain) {
      fetchStoreData()
    }
  }, [subdomain])

  return null
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
