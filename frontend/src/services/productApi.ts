// Product API Service
import type { Product, Category, ProductFilters, ProductFormData, PaginatedProducts, ApiResponse } from '@/types/product'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

class ProductApiService {
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    }

    const config: RequestInit = {
      ...options,
      headers: defaultHeaders,
      credentials: 'include', // Include cookies for authentication
    }

    const response = await fetch(`${API_BASE_URL}${url}`, config)
    return response
  }

  // Get products by store
  async getProductsByStore(storeUuid: string, filters: ProductFilters = {}): Promise<PaginatedProducts> {
    const queryParams = new URLSearchParams()
    
    // Add store UUID to filters
    queryParams.append('store_uuid', storeUuid)
    
    // Add other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        queryParams.append(key, String(value))
      }
    })

    const response = await this.fetchWithAuth(`/products?${queryParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }

    const result: ApiResponse<PaginatedProducts> = await response.json()
    
    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Get all products (with optional filters)
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedProducts> {
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        queryParams.append(key, String(value))
      }
    })

    const response = await this.fetchWithAuth(`/products?${queryParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }

    const result: ApiResponse<PaginatedProducts> = await response.json()
    
    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Get single product
  async getProduct(uuid: string): Promise<Product> {
    const response = await this.fetchWithAuth(`/products/${uuid}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch product')
    }

    const result: ApiResponse<Product> = await response.json()
    
    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Create product
  async createProduct(data: ProductFormData): Promise<Product> {
    const formData = new FormData()
    
    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'images') {
        // Handle file uploads separately
        return
      }
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })

    // Add image files
    if (data.images && data.images.length > 0) {
      data.images.forEach((file, index) => {
        formData.append(`images[${index}]`, file)
      })
    }

    const response = await this.fetchWithAuth('/products', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set boundary for FormData
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to create product')
    }

    const result: ApiResponse<Product> = await response.json()
    
    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Update product
  async updateProduct(uuid: string, data: Partial<ProductFormData>): Promise<Product> {
    const formData = new FormData()
    
    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'images') {
        return
      }
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })

    // Add image files if provided
    if (data.images && data.images.length > 0) {
      data.images.forEach((file, index) => {
        formData.append(`images[${index}]`, file)
      })
    }

    const response = await this.fetchWithAuth(`/products/${uuid}`, {
      method: 'PUT',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to update product')
    }

    const result: ApiResponse<Product> = await response.json()
    
    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Delete product
  async deleteProduct(uuid: string): Promise<void> {
    const response = await this.fetchWithAuth(`/products/${uuid}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete product')
    }

    const result: ApiResponse = await response.json()
    
    if (result.status === 'error') {
      throw new Error(result.message)
    }
  }

  // Update product status
  async updateProductStatus(uuid: string, status: 'active' | 'inactive' | 'draft'): Promise<Product> {
    const response = await this.fetchWithAuth(`/products/${uuid}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status_produk: status }),
    })

    if (!response.ok) {
      throw new Error('Failed to update product status')
    }

    const result: ApiResponse<Product> = await response.json()
    
    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Update product stock
  async updateProductStock(uuid: string, stock: number): Promise<Product> {
    const response = await this.fetchWithAuth(`/products/${uuid}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    })

    if (!response.ok) {
      throw new Error('Failed to update product stock')
    }

    const result: ApiResponse<Product> = await response.json()
    
    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Get categories
  async getCategories(): Promise<Category[]> {
    const response = await this.fetchWithAuth('/public/categories')
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }

    const result: ApiResponse<Category[]> = await response.json()
    
    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Get active categories
  async getActiveCategories(): Promise<Category[]> {
    const response = await this.fetchWithAuth('/categories/active')
    
    if (!response.ok) {
      throw new Error('Failed to fetch active categories')
    }

    const result: ApiResponse<Category[]> = await response.json()
    
    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }
}

// Export singleton instance
export const productApi = new ProductApiService()
export default productApi