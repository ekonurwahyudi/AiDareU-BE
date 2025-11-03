// Dashboard API Service
export interface DashboardStats {
  total_orders: number
  total_revenue: number
  total_products: number
  total_customers: number
  orders_growth: number
  revenue_growth: number
  products_growth: number
  customers_growth: number
}

export interface RevenueData {
  date: string
  revenue: number
  orders: number
}

export interface PopularProduct {
  uuid: string
  name: string
  image: string
  total_sold: number
  revenue: number
}

export interface RecentOrder {
  uuid: string
  order_number: string
  customer_name: string
  total: number
  status: string
  created_at: string
}

export interface CustomerData {
  uuid: string
  name: string
  email: string
  total_orders: number
  total_spent: number
}

interface ApiResponse<T = any> {
  status: 'success' | 'error'
  message: string
  data: T
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

class DashboardApiService {
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    }

    const config: RequestInit = {
      ...options,
      headers: defaultHeaders,
      credentials: 'include',
    }

    const response = await fetch(`${API_BASE_URL}${url}`, config)

    return response
  }

  // Get dashboard statistics
  async getDashboardStats(storeUuid?: string): Promise<DashboardStats> {
    const params = storeUuid ? `?store_uuid=${storeUuid}` : ''
    const response = await this.fetchWithAuth(`/dashboard/stats${params}`)

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard statistics')
    }

    const result: ApiResponse<DashboardStats> = await response.json()

    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Get revenue data for charts
  async getRevenueData(storeUuid?: string, period: 'week' | 'month' | 'year' = 'month'): Promise<RevenueData[]> {
    const params = new URLSearchParams({ period })

    if (storeUuid) params.append('store_uuid', storeUuid)

    const response = await this.fetchWithAuth(`/dashboard/revenue?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to fetch revenue data')
    }

    const result: ApiResponse<RevenueData[]> = await response.json()

    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Get popular products
  async getPopularProducts(storeUuid?: string, limit: number = 5): Promise<PopularProduct[]> {
    const params = new URLSearchParams({ limit: limit.toString() })

    if (storeUuid) params.append('store_uuid', storeUuid)

    const response = await this.fetchWithAuth(`/dashboard/popular-products?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to fetch popular products')
    }

    const result: ApiResponse<PopularProduct[]> = await response.json()

    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Get recent orders
  async getRecentOrders(storeUuid?: string, limit: number = 10): Promise<RecentOrder[]> {
    const params = new URLSearchParams({ limit: limit.toString() })

    if (storeUuid) params.append('store_uuid', storeUuid)

    const response = await this.fetchWithAuth(`/dashboard/recent-orders?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to fetch recent orders')
    }

    const result: ApiResponse<RecentOrder[]> = await response.json()

    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Get customer data
  async getCustomers(storeUuid?: string, limit: number = 10): Promise<CustomerData[]> {
    const params = new URLSearchParams({ limit: limit.toString() })

    if (storeUuid) params.append('store_uuid', storeUuid)

    const response = await this.fetchWithAuth(`/dashboard/customers?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to fetch customers')
    }

    const result: ApiResponse<CustomerData[]> = await response.json()

    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  }

  // Get user's store UUID from localStorage
  getUserStoreUuid(): string | null {
    if (typeof window === 'undefined') return null

    const userData = localStorage.getItem('user_data')

    if (!userData) return null

    try {
      const user = JSON.parse(userData)

      return user.store?.uuid || null
    } catch (error) {
      console.error('Error parsing user data:', error)

      return null
    }
  }
}

// Export singleton instance
export const dashboardApi = new DashboardApiService()
export default dashboardApi
