'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Box, Container, Typography, Button, Divider, Skeleton, Card, CardContent } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// Custom Hook
import { useStoreMetadata } from '../../useStoreMetadata'

// Helper functions
const formatRupiah = (amount: number): string => {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export default function InvoicePage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = (params?.subdomain as string) || 'store'

  const [orderData, setOrderData] = useState<any>(null)
  const [storeData, setStoreData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch store data
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
        }
      } catch (error) {
        console.error('Error fetching store data:', error)
      }
    }

    if (subdomain) {
      fetchStoreData()
    }
  }, [subdomain])

  useEffect(() => {
    if (params.uuid) {
      fetchInvoiceData()
    }
  }, [params.uuid])

  const fetchInvoiceData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/order/${params.uuid}`)
      const result = await response.json()

      if (result.success) {
        setOrderData(result.data)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error('Error fetching invoice:', err)
      setError('Gagal mengambil data invoice')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Update metadata untuk halaman invoice
  useStoreMetadata({
    title: orderData && storeData
      ? `${storeData.settings?.site_title || storeData.store?.name} - Invoice #${orderData.nomor_order || orderData.id}`
      : 'Invoice',
    description: orderData
      ? `Invoice untuk order #${orderData.nomor_order || orderData.id} - Total: ${formatRupiah(orderData.total_harga)}`
      : 'Invoice pembelian',
    keywords: 'invoice, nota, pembelian',
    ogTitle: orderData && storeData
      ? `Invoice #${orderData.nomor_order || orderData.id} - ${storeData.settings?.site_title || storeData.store?.name}`
      : 'Invoice',
    ogDescription: orderData
      ? `Lihat detail invoice untuk order #${orderData.nomor_order || orderData.id}`
      : '',
    ogImage: storeData?.settings?.logo,
    favicon: storeData?.settings?.favicon
  })

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, bgcolor: 'white', minHeight: '100vh' }}>
        {/* Header Skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Skeleton variant="text" width={150} height={40} />
            <Skeleton variant="text" width={200} height={25} />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Skeleton variant="text" width={180} height={30} />
            <Skeleton variant="text" width={120} height={20} />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Customer & Payment Info Skeleton */}
        <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={150} height={25} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="90%" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={180} height={25} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="85%" />
            <Skeleton variant="text" width="95%" />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Items Table Skeleton */}
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={120} height={25} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
        </Box>

        {/* Summary Skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Box sx={{ minWidth: 300 }}>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="100%" />
            <Divider sx={{ my: 1 }} />
            <Skeleton variant="text" width="100%" height={35} />
          </Box>
        </Box>
      </Container>
    )
  }

  if (error || !orderData) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="error" variant="h6">{error || 'Invoice tidak ditemukan'}</Typography>
        <Button onClick={() => router.push(subdomain === 'store' ? '/store' : `/s/${subdomain}`)} sx={{ mt: 2 }}>Kembali ke Store</Button>
      </Container>
    )
  }

  const subtotal = orderData.detail_orders?.reduce(
    (sum: number, item: any) => sum + (item.price * item.quantity),
    0
  ) || 0
  const ongkir = orderData.total_harga - subtotal

  // Get primary color from store settings
  const primaryColor = storeData?.settings?.primary_color || '#E91E63'

  return (
    <>
      {/* Apply dynamic primary color */}
      <style jsx global>{`
        :root {
          --primary-color: ${primaryColor};
        }
        .MuiButton-containedPrimary {
          background-color: ${primaryColor} !important;
        }
        .MuiButton-containedPrimary:hover {
          background-color: ${primaryColor}dd !important;
        }
      `}</style>

      {/* Print Button - Hidden when printing */}
      <Box className="no-print" sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'center', bgcolor: '#f5f5f5' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(subdomain === 'store' ? '/store' : `/s/${subdomain}`)}
        >
          Kembali
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Cetak Invoice
        </Button>
      </Box>

      {/* Invoice Content */}
      <Container maxWidth="md" sx={{ py: 4, bgcolor: 'white', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            {storeData?.settings?.logo ? (
              <Box sx={{ mb: 1 }}>
                <img
                  src={`http://localhost:8000/storage/${storeData.settings.logo}`}
                  alt={storeData?.store?.name || 'Store Logo'}
                  style={{ height: 50, width: 'auto', objectFit: 'contain' }}
                />
              </Box>
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#E91E63', mb: 1 }}>
                ❤️ {storeData?.store?.name || orderData.store?.name || 'AiDareU'}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {storeData?.store?.name || orderData.store?.name || 'AiDareU Store'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {storeData?.store?.phone || orderData.store?.phone || '-'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Invoice #{orderData.nomor_order || orderData.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tanggal: {formatDate(orderData.created_at)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status: <span style={{ color: '#4caf50', fontWeight: 600 }}>{orderData.status || 'Pending'}</span>
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Customer & Payment Info */}
        <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Informasi Pembeli
            </Typography>
            <Typography variant="body2">{orderData.customer?.nama || '-'}</Typography>
            <Typography variant="body2">{orderData.customer?.email || '-'}</Typography>
            <Typography variant="body2">{orderData.customer?.no_hp || '-'}</Typography>
            {orderData.customer?.alamat && orderData.customer.alamat !== '-' && (
              <>
                <Typography variant="body2" sx={{ mt: 1 }}>{orderData.customer.alamat}</Typography>
                <Typography variant="body2">
                  {orderData.customer.kecamatan}, {orderData.customer.kota}
                </Typography>
                <Typography variant="body2">{orderData.customer.provinsi}</Typography>
              </>
            )}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Informasi Pembayaran
            </Typography>
            <Typography variant="body2">
              Bank: {orderData.bank_account?.bank_name || '-'}
            </Typography>
            <Typography variant="body2">
              Atas Nama: {orderData.bank_account?.account_holder_name || '-'}
            </Typography>
            <Typography variant="body2">
              No. Rekening: <strong>{orderData.bank_account?.account_number || '-'}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Ekspedisi: {orderData.ekspedisi || '-'}
            </Typography>
            {orderData.estimasi_tiba && (
              <Typography variant="body2">
                Estimasi: {orderData.estimasi_tiba}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Items Table */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
            Detail Produk
          </Typography>

          <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
            {/* Table Header */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '3fr 1fr 1fr 1fr',
              gap: 2,
              p: 2,
              bgcolor: '#f5f5f5',
              fontWeight: 'bold',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Produk</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>Harga</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>Qty</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'right' }}>Total</Typography>
            </Box>

            {/* Table Body */}
            {orderData.detail_orders?.map((item: any, index: number) => (
              <Box
                key={item.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 1fr 1fr 1fr',
                  gap: 2,
                  p: 2,
                  borderBottom: index < orderData.detail_orders.length - 1 ? '1px solid #e0e0e0' : 'none'
                }}
              >
                <Typography variant="body2">{item.product?.nama_produk || item.product?.name || 'Product'}</Typography>
                <Typography variant="body2" sx={{ textAlign: 'center' }}>{formatRupiah(item.price)}</Typography>
                <Typography variant="body2" sx={{ textAlign: 'center' }}>{item.quantity}</Typography>
                <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 600 }}>
                  {formatRupiah(item.price * item.quantity)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Box sx={{ minWidth: 300 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">{formatRupiah(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Ongkir:</Typography>
              <Typography variant="body2">{formatRupiah(ongkir)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#E91E63' }}>
                {formatRupiah(orderData.total_harga)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Terima kasih atas pembelian Anda!
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Invoice ini dibuat secara otomatis oleh sistem {storeData?.store?.name || 'AiDareU'}
          </Typography>
        </Box>
      </Container>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </>
  )
}
