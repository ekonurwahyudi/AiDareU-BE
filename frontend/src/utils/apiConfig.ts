/**
 * API Configuration Helper
 * Centralized configuration for all API URLs
 */

// Base API URL for client-side requests (from browser)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

// Backend base URL (without /api suffix)
export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

// Server-side API URL (for Next.js API routes and server components)
export const SERVER_API_URL = process.env.API_URL || 'http://localhost:8080/api'

/**
 * Get full URL for storage assets
 * @param path - Path to the storage file (e.g., 'products/image.jpg')
 * @returns Full URL to the storage asset
 */
export function getStorageUrl(path: string): string {
  if (!path) return '/placeholder.jpg'

  // If path is already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  return `${BACKEND_BASE_URL}/storage/${cleanPath}`
}

/**
 * Get API endpoint URL
 * @param endpoint - API endpoint path (e.g., '/products' or 'products')
 * @returns Full API URL
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

  return `${API_BASE_URL}/${cleanEndpoint}`
}

/**
 * Get backend URL
 * @param path - Path to append to backend URL
 * @returns Full backend URL
 */
export function getBackendUrl(path: string = ''): string {
  if (!path) return BACKEND_BASE_URL

  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${BACKEND_BASE_URL}/${cleanPath}`
}

export default {
  API_BASE_URL,
  BACKEND_BASE_URL,
  SERVER_API_URL,
  getStorageUrl,
  getApiUrl,
  getBackendUrl
}
