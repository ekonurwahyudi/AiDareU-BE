/**
 * ! The server actions below are used to fetch the static data from the fake-db. If you're using an ORM
 * ! (Object-Relational Mapping) or a database, you can swap the code below with your own database queries.
 */

'use server'

// Data Imports
import { db as eCommerceData } from '@/fake-db/apps/ecommerce'
import { db as academyData } from '@/fake-db/apps/academy'
import { db as vehicleData } from '@/fake-db/apps/logistics'
import { db as invoiceData } from '@/fake-db/apps/invoice'
import { db as userData } from '@/fake-db/apps/userList'
import { db as permissionData } from '@/fake-db/apps/permissions'
import { db as profileData } from '@/fake-db/pages/userProfile'
import { db as faqData } from '@/fake-db/pages/faq'
import { db as pricingData } from '@/fake-db/pages/pricing'
import { db as statisticsData } from '@/fake-db/pages/widgetExamples'
import { cookies } from 'next/headers'

const API_BASE_URL = process.env.API_URL || 'http://localhost:8000/api'

export const getEcommerceData = async () => {
  return eCommerceData
}

export const getAcademyData = async () => {
  return academyData
}

export const getLogisticsData = async () => {
  return vehicleData
}

export const getInvoiceData = async () => {
  return invoiceData
}

export const getUserData = async () => {
  return userData
}

export const getPermissionsData = async () => {
  return permissionData
}

export const getProfileData = async () => {
  return profileData
}

export const getFaqData = async () => {
  return faqData
}

export const getPricingData = async () => {
  return pricingData
}

export const getStatisticsData = async () => {
  return statisticsData
}

// Dashboard API actions
export const getDashboardStats = async (storeUuid?: string) => {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    const userDataCookie = cookieStore.get('user_data')?.value

    // Get user UUID from cookies
    let userUuid = null
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie)
        userUuid = userData.uuid
      } catch (e) {
        console.error('Failed to parse user_data cookie:', e)
      }
    }

    const params = storeUuid ? `?store_uuid=${storeUuid}` : ''
    const response = await fetch(`${API_BASE_URL}/dashboard/stats${params}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(userUuid ? { 'X-User-UUID': userUuid } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard statistics')
    }

    const result = await response.json()

    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)

    // Return default data if API fails
    return {
      total_orders: 0,
      total_revenue: 0,
      total_products: 0,
      total_customers: 0,
      orders_growth: 0,
      revenue_growth: 0,
      products_growth: 0,
      customers_growth: 0,
    }
  }
}

export const getRevenueData = async (storeUuid?: string, period: 'week' | 'month' | 'year' = 'month') => {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    const userDataCookie = cookieStore.get('user_data')?.value

    let userUuid = null
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie)
        userUuid = userData.uuid
      } catch (e) {}
    }

    const params = new URLSearchParams({ period })

    if (storeUuid) params.append('store_uuid', storeUuid)

    const response = await fetch(`${API_BASE_URL}/dashboard/revenue?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(userUuid ? { 'X-User-UUID': userUuid } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch revenue data')
    }

    const result = await response.json()

    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  } catch (error) {
    console.error('Error fetching revenue data:', error)

    return []
  }
}

export const getPopularProducts = async (storeUuid?: string, limit: number = 5) => {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    const userDataCookie = cookieStore.get('user_data')?.value

    let userUuid = null
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie)
        userUuid = userData.uuid
      } catch (e) {}
    }

    const params = new URLSearchParams({ limit: limit.toString() })

    if (storeUuid) params.append('store_uuid', storeUuid)

    const response = await fetch(`${API_BASE_URL}/dashboard/popular-products?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(userUuid ? { 'X-User-UUID': userUuid } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch popular products')
    }

    const result = await response.json()

    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  } catch (error) {
    console.error('Error fetching popular products:', error)

    return []
  }
}

export const getRecentOrders = async (storeUuid?: string, limit: number = 10) => {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    const userDataCookie = cookieStore.get('user_data')?.value

    let userUuid = null
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie)
        userUuid = userData.uuid
      } catch (e) {}
    }

    const params = new URLSearchParams({ limit: limit.toString() })

    if (storeUuid) params.append('store_uuid', storeUuid)

    const response = await fetch(`${API_BASE_URL}/dashboard/recent-orders?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(userUuid ? { 'X-User-UUID': userUuid } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch recent orders')
    }

    const result = await response.json()

    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  } catch (error) {
    console.error('Error fetching recent orders:', error)

    return []
  }
}

export const getDashboardCustomers = async (storeUuid?: string, limit: number = 10) => {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value

    const params = new URLSearchParams({ limit: limit.toString() })

    if (storeUuid) params.append('store_uuid', storeUuid)

    const response = await fetch(`${API_BASE_URL}/dashboard/customers?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch customers')
    }

    const result = await response.json()

    if (result.status === 'error') {
      throw new Error(result.message)
    }

    return result.data
  } catch (error) {
    console.error('Error fetching customers:', error)

    return []
  }
}

export const getUserStoreUuid = async () => {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    const userDataCookie = cookieStore.get('user_data')?.value

    let userUuid = null
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie)
        userUuid = userData.uuid
      } catch (e) {}
    }

    if (!authToken && !userUuid) return null

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(userUuid ? { 'X-User-UUID': userUuid } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()

    if (result.status === 'error') {
      return null
    }

    return result.data?.store?.uuid || null
  } catch (error) {
    console.error('Error fetching user store:', error)

    return null
  }
}

export const getUserInfo = async () => {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    const userDataCookie = cookieStore.get('user_data')?.value

    let userUuid = null
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie)
        userUuid = userData.uuid
      } catch (e) {}
    }

    if (!authToken && !userUuid) {
      console.log('No auth token or user UUID found')

      return null
    }

    console.log('Fetching user info with token:', authToken?.substring(0, 10) + '...')

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(userUuid ? { 'X-User-UUID': userUuid } : {}),
      },
      cache: 'no-store',
    })

    console.log('User info response status:', response.status)

    if (!response.ok) {
      console.error('Failed to fetch user info:', response.statusText)

      return null
    }

    const result = await response.json()

    console.log('User info result:', result)

    if (result.status === 'error') {
      console.error('User info error:', result.message)

      return null
    }

    return result.data
  } catch (error) {
    console.error('Error fetching user info:', error)

    return null
  }
}
