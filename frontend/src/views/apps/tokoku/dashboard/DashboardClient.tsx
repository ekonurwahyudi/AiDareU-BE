'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

// Component Imports
import CongratulationsJohn from './Congratulations'
import DashboardContent from './DashboardContent'

const DashboardClient = () => {
  const { user, currentStore, isLoading: rbacLoading } = useRBAC()
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any>(null)
  const [popularProducts, setPopularProducts] = useState<any>(null)

  useEffect(() => {
    if (!rbacLoading && currentStore) {
      fetchDashboardData()
    }
  }, [rbacLoading, currentStore])

  const fetchDashboardData = async () => {
    if (!currentStore?.uuid) {
      console.warn('No store UUID available')
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const storeUuid = currentStore.uuid

      // Get auth headers
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (storedUserData) {
        const userData = JSON.parse(storedUserData)
        if (userData.uuid) {
          headers['X-User-UUID'] = userData.uuid
        }
      }

      // Fetch all dashboard data in parallel
      const [statsRes, revenueRes, productsRes] = await Promise.allSettled([
        fetch(`${apiUrl}/dashboard/stats?store_uuid=${storeUuid}`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        }),
        fetch(`${apiUrl}/dashboard/revenue?store_uuid=${storeUuid}&period=month`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        }),
        fetch(`${apiUrl}/dashboard/popular-products?store_uuid=${storeUuid}&limit=5`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        })
      ])

      // Process stats
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const statsData = await statsRes.value.json()
        if (statsData.status === 'success') {
          setDashboardStats(statsData.data)
        }
      }

      // Process revenue
      if (revenueRes.status === 'fulfilled' && revenueRes.value.ok) {
        const revData = await revenueRes.value.json()
        if (revData.status === 'success') {
          setRevenueData(revData.data)
        }
      }

      // Process popular products
      if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
        const prodData = await productsRes.value.json()
        if (prodData.status === 'success') {
          setPopularProducts(prodData.data)
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (rbacLoading || loading) {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent className='flex flex-col gap-4'>
              <Skeleton variant='text' width={180} height={28} />
              <Skeleton variant='text' width='100%' height={24} />
              <Skeleton variant='rounded' width='100%' height={120} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Skeleton variant='text' width={120} height={24} />
              <Skeleton variant='text' width={100} height={40} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Skeleton variant='text' width={120} height={24} />
              <Skeleton variant='text' width={100} height={40} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const monthlyRevenue = dashboardStats?.total_revenue || 0

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 4 }}>
        <CongratulationsJohn
          userName={user?.name || user?.nama_lengkap || null}
          monthlyRevenue={monthlyRevenue}
          storeName={currentStore?.name || currentStore?.nama_toko || null}
        />
      </Grid>
      <DashboardContent
        dashboardStats={dashboardStats}
        revenueData={revenueData}
        popularProducts={popularProducts}
      />
    </Grid>
  )
}

export default DashboardClient
