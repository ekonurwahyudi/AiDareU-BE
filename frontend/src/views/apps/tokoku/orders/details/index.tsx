'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

// Component Imports
import OrderDetailHeader from './OrderDetailHeader'
import OrderDetailsCard from './OrderDetailsCard'
import CustomerDetailsCard from './CustomerDetailsCard'
import InvoiceCard from './InvoiceCard'

// Type
type Order = {
  id: number
  uuid: string
  uuid_store: string
  uuid_customer: string
  nomor_order: string
  voucher?: string
  total_harga: number
  ekspedisi: string
  estimasi_tiba?: string
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  uuid_bank_account: string
  created_at: string
  updated_at: string
  customer?: {
    uuid: string
    nama: string
    email?: string
    no_hp: string
    provinsi?: string
    kota?: string
    kecamatan?: string
    alamat?: string
  }
  bankAccount?: {
    uuid: string
    nama_bank: string
    nomor_rekening: string
    atas_nama: string
  }
  detailOrders?: Array<{
    uuid: string
    quantity: number
    price: number
    product?: {
      uuid: string
      nama_produk: string
      upload_gambar_produk?: string | string[]
      sku?: string
    }
  }>
  detail_orders?: Array<{
    uuid: string
    quantity: number
    price: number
    product?: {
      uuid: string
      nama_produk: string
      upload_gambar_produk?: string | string[]
      sku?: string
    }
  }>
}

const OrderDetails = ({ orderId }: { orderId: string }) => {
  const router = useRouter()
  const { currentStore, isLoading: rbacLoading } = useRBAC()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Scroll to status update section
  const scrollToStatus = () => {
    const statusElement = document.getElementById('status-update-section')
    if (statusElement) {
      statusElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
        const response = await fetch(`${apiUrl}/order/${orderId}`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          // Normalize snake_case to camelCase for detailOrders
          const orderData = result.data
          if (orderData.detail_orders && !orderData.detailOrders) {
            orderData.detailOrders = orderData.detail_orders
          }
          setOrder(orderData)
        } else {
          throw new Error(result.message || 'Failed to fetch order details')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order details')
        console.error('Error fetching order details:', err)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  // Handle status update
  const handleStatusUpdate = async (newStatus: Order['status']) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

      console.log('Updating order status:', {
        orderId,
        newStatus,
        url: `${apiUrl}/order/${orderId}/status`
      })

      const response = await fetch(`${apiUrl}/order/${orderId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()

      console.log('Update status response:', result)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (result.success) {
        console.log('Status updated successfully, redirecting...')
        // Store a flag in sessionStorage to trigger refresh
        sessionStorage.setItem('orderStatusUpdated', 'true')
        // Redirect to orders list after successful update
        router.push('/apps/tokoku/orders')
      } else {
        throw new Error(result.message || 'Failed to update order status')
      }
    } catch (err) {
      console.error('Error updating order status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update order status')
      throw err // Re-throw to let CustomerDetailsCard handle it
    }
  }

  if (rbacLoading || loading) {
    return (
      <Grid container spacing={6}>
        {/* Header Skeleton */}
        <Grid size={{ xs: 12 }}>
          <div className='flex justify-between items-center'>
            <div className='flex flex-col gap-2'>
              <Skeleton variant="text" width={300} height={40} />
              <Skeleton variant="text" width={200} height={20} />
            </div>
            <div className='flex gap-3'>
              <Skeleton variant="rounded" width={150} height={40} />
              <Skeleton variant="rounded" width={150} height={40} />
            </div>
          </div>
        </Grid>

        {/* Main Content Skeleton */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={6}>
            {/* Order Details Card Skeleton */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardHeader title={<Skeleton variant="text" width={150} />} />
                <CardContent>
                  <Skeleton variant="rectangular" height={200} />
                  <div className='flex justify-end mt-4'>
                    <div className='flex flex-col gap-2 w-64'>
                      <Skeleton variant="text" />
                      <Skeleton variant="text" />
                      <Skeleton variant="text" width={180} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Invoice Card Skeleton */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardHeader title={<Skeleton variant="text" width={100} />} />
                <CardContent>
                  <Skeleton variant="rectangular" height={250} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Sidebar Skeleton */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title={<Skeleton variant="text" width={150} />} />
            <CardContent className='flex flex-col gap-4'>
              <Skeleton variant="circular" width={50} height={50} />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="rectangular" height={120} />
              <Skeleton variant="rectangular" height={60} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  if (error) {
    return (
      <Alert severity="error" className="m-6">
        {error}
      </Alert>
    )
  }

  if (!order) {
    return (
      <Alert severity="warning" className="m-6">
        Order not found
      </Alert>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <OrderDetailHeader order={order} onScrollToStatus={scrollToStatus} />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <OrderDetailsCard order={order} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <InvoiceCard order={order} />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <CustomerDetailsCard order={order} onStatusUpdate={handleStatusUpdate} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default OrderDetails
