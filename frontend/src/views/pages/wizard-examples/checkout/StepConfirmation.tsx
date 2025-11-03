'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

// Helper function to format currency in Rupiah
const formatRupiah = (amount: number): string => {
  return `Rp. ${Math.round(amount).toLocaleString('id-ID')}`
}

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface StepConfirmationProps {
  checkoutData: any
  orderUuid: string | null
  primaryColor?: string
}

const StepConfirmation = ({ checkoutData, orderUuid, primaryColor = '#E91E63' }: StepConfirmationProps) => {
  const params = useParams()
  const subdomain = (params?.subdomain as string) || 'store'

  const [orderData, setOrderData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderUuid) {
      fetchOrderDetails()
    }
  }, [orderUuid])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/order/${orderUuid}`)
      const result = await response.json()

      console.log('Order API Response:', result)

      if (result.success) {
        // Transform data to match frontend expectations (camelCase)
        const transformedData = {
          ...result.data,
          nomorOrder: result.data.nomor_order || result.data.nomorOrder,
          totalHarga: result.data.total_harga || result.data.totalHarga,
          estimasiTiba: result.data.estimasi_tiba || result.data.estimasiTiba,
          uuidStore: result.data.uuid_store || result.data.uuidStore,
          uuidCustomer: result.data.uuid_customer || result.data.uuidCustomer,
          uuidBankAccount: result.data.uuid_bank_account || result.data.uuidBankAccount,
          detailOrders: result.data.detail_orders || result.data.detailOrders || [],
          bankAccount: result.data.bank_account || result.data.bankAccount,
          createdAt: result.data.created_at || result.data.createdAt,
          updatedAt: result.data.updated_at || result.data.updatedAt
        }

        console.log('Transformed Order Data:', transformedData)
        setOrderData(transformedData)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('Gagal mengambil data order')
    } finally {
      setLoading(false)
    }
  }

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    if (!orderData) return ''

    const orderNumber = orderData.nomorOrder || orderData.nomor_order || 'N/A'
    const totalPrice = orderData.totalHarga || orderData.total_harga || 0
    const customerName = orderData.customer?.nama || 'Customer'

    const message = `Halo, saya ingin konfirmasi pembayaran untuk:

*Nomor Order:* ${orderNumber}
*Total:* ${formatRupiah(totalPrice)}
*Nama:* ${customerName}

Saya sudah melakukan transfer. Mohon dicek ya! Terima kasih 🙏`

    return encodeURIComponent(message)
  }

  const handleWhatsAppClick = () => {
    if (orderData && orderData.store && orderData.store.phone) {
      const phone = orderData.store.phone.replace(/^0/, '62').replace(/\D/g, '')
      const message = generateWhatsAppMessage()
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
    } else {
      alert('Nomor WhatsApp toko tidak tersedia')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !orderData) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="error" variant="h6" sx={{ mb: 2 }}>
          {error || 'Data order tidak ditemukan'}
        </Typography>
        <Button
          component={Link}
          href={subdomain === 'store' ? '/store' : `/s/${subdomain}`}
          variant="contained"
          sx={{ bgcolor: primaryColor, '&:hover': { bgcolor: `${primaryColor}dd` }, boxShadow: 'none !important' }}
        >
          Kembali ke Store
        </Button>
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <div className='flex items-center flex-col text-center gap-4'>
          <Typography variant='h4'>Terima Kasih! 😇</Typography>
          <Typography>
            Orderan Kamu <span className='font-medium text-textPrimary'>#{orderData.nomorOrder || orderData.nomor_order || 'N/A'}</span> Sedang diProses!
          </Typography>
          <div>
            <Typography>
              Silahkan lakukan pembayaran sesuai dengan jumlah yang tertera di Orderan Kamu!
            </Typography>
            <Typography>
              Kemudian jangan lupa konfirmasi ke kami ya!
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<WhatsAppIcon />}
            sx={{
              bgcolor: '#25D366',
              '&:hover': { bgcolor: '#128C7E' },
              borderRadius: 3,
              boxShadow: 'none',
              filter: 'none',
              '&:focus': { boxShadow: 'none', filter: 'none' },
              '&:focus-visible': { boxShadow: 'none', filter: 'none' },
              '&:active': { boxShadow: 'none', filter: 'none' },
              '&.MuiButton-root': { boxShadow: 'none' },
              '&.MuiButton-contained': { boxShadow: 'none' },
              mt: 2
            }}
            onClick={handleWhatsAppClick}
          >
            Konfirmasi Pembayaran
          </Button>
          <div className='flex items-center gap-2'>
            <i className='tabler-clock text-xl' />
            <Typography>Waktu Order: {formatDate(orderData.createdAt)}</Typography>
          </div>
        </div>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <div className='flex flex-col md:flex-row border rounded'>
          {/* Customer Information */}
          <div className='flex flex-col is-full items-center p-6 sm:items-start max-md:[&:not(:last-child)]:border-be md:[&:not(:last-child)]:border-ie'>
            <div className='flex items-center gap-2 mbe-4'>
              <i className='tabler-map-pin text-xl text-textPrimary' />
              <Typography color='text.primary' className='font-medium'>
                Informasi Pembeli
              </Typography>
            </div>
            <Typography>Nama: {orderData.customer?.nama || '-'}</Typography>
            <Typography>Email: {orderData.customer?.email || '-'}</Typography>
            <Typography>No. Hp: {orderData.customer?.no_hp || orderData.customer?.noHp || '-'}</Typography>
            {orderData.customer?.alamat && orderData.customer.alamat !== '-' && (
              <>
                <Typography>Alamat: {orderData.customer.alamat}</Typography>
                <Typography>
                  {orderData.customer.kecamatan}, {orderData.customer.kota}
                </Typography>
                <Typography>{orderData.customer.provinsi}</Typography>
              </>
            )}
          </div>

          {/* Payment Information */}
          <div className='flex flex-col is-full items-center p-6 sm:items-start max-md:[&:not(:last-child)]:border-be md:[&:not(:last-child)]:border-ie'>
            <div className='flex items-center gap-2 mbe-4'>
              <i className='tabler-credit-card text-xl text-textPrimary' />
              <Typography color='text.primary' className='font-medium'>
                Informasi Pembayaran
              </Typography>
            </div>
            <Typography>Bank: {orderData.bankAccount?.bank_name || orderData.bankAccount?.bankName || '-'}</Typography>
            <Typography>Atas Nama: {orderData.bankAccount?.account_holder_name || orderData.bankAccount?.accountName || '-'}</Typography>
            <Typography>
              No. Rekening: <strong>{orderData.bankAccount?.account_number || orderData.bankAccount?.accountNo || '-'}</strong>
            </Typography>
          </div>

          {/* Shipping Information */}
          <div className='flex flex-col is-full items-center p-6 sm:items-start'>
            <div className='flex items-center gap-2 mbe-4'>
              <i className='tabler-ship text-xl text-textPrimary' />
              <Typography color='text.primary' className='font-medium'>
                Metode Pengiriman
              </Typography>
            </div>
            <Typography className='mbe-2'>Ekspedisi: {orderData.ekspedisi}</Typography>
            {orderData.estimasiTiba && (
              <Typography>Estimasi Tiba: {orderData.estimasiTiba}</Typography>
            )}
            {orderData.ekspedisi === 'Digital Product' && (
              <Chip
                label='Produk Digital'
                color='info'
                size='small'
                sx={{ mt: 1 }}
              />
            )}
          </div>
        </div>
      </Grid>

      {/* Product Details */}
      <Grid size={{ xs: 12, md: 8, xl: 9 }}>
        <div className='border rounded'>
          {orderData.detailOrders?.map((detail: any, index: number) => {
            const product = detail.product || {}
            const productName = product.nama_produk || product.name || 'Product'
            const productImage = product.upload_gambar_produk?.[0] || product.image
            const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
            const imageUrl = productImage ? `${backendUrl}/storage/${productImage}` : null

            return (
              <div
                key={detail.id}
                className='flex flex-col sm:flex-row items-center gap-4 p-6 [&:not(:last-child)]:border-be'
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: '#f5f5f5',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={productName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: '2rem' }}>📦</Typography>
                  )}
                </Box>
                <div className='flex justify-between is-full flex-col sm:flex-row items-center gap-2'>
                  <div className='flex flex-col items-center sm:items-start gap-2'>
                    <Typography color='text.primary' className='font-medium'>
                      {productName}
                    </Typography>
                    <div className='flex flex-col items-baseline gap-2'>
                      <Typography variant='body2' color='text.secondary'>
                        Qty: {detail.quantity}
                      </Typography>
                      <Chip variant='tonal' size='small' color='success' label='Tersedia' />
                    </div>
                  </div>
                  <div className='flex items-center'>
                    <Typography sx={{ color: primaryColor }} className='font-medium'>
                      {formatRupiah(detail.price)}
                    </Typography>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Grid>

      {/* Price Summary */}
      <Grid size={{ xs: 12, md: 4, xl: 3 }}>
        <div className='border rounded'>
          <CardContent className='flex gap-4 flex-col'>
            <Typography color='text.primary' className='font-medium'>
              Detail Harga
            </Typography>
            <div className='flex flex-col gap-4'>
              <div className='flex items-center justify-between gap-2'>
                <Typography color='text.primary'>Subtotal</Typography>
                <Typography color='text.primary'>
                  {formatRupiah(
                    orderData.detailOrders.reduce(
                      (sum: number, detail: any) => sum + detail.price * detail.quantity,
                      0
                    )
                  )}
                </Typography>
              </div>
              {orderData.ekspedisi !== 'Digital Product' && (
                <div className='flex items-center justify-between gap-2'>
                  <Typography color='text.primary'>Ongkir</Typography>
                  <Typography color='text.primary'>
                    {formatRupiah(
                      orderData.totalHarga -
                        orderData.detailOrders.reduce(
                          (sum: number, detail: any) => sum + detail.price * detail.quantity,
                          0
                        )
                    )}
                  </Typography>
                </div>
              )}
              {orderData.voucher && (
                <div className='flex items-center justify-between gap-2'>
                  <Typography color='text.primary'>Voucher</Typography>
                  <Chip variant='tonal' size='small' color='success' label={orderData.voucher} />
                </div>
              )}
            </div>
          </CardContent>
          <Divider />
          <CardContent>
            <div className='flex items-center justify-between gap-2'>
              <Typography color='text.primary' className='font-medium'>
                Total
              </Typography>
              <Typography color='text.primary' className='font-medium'>
                {formatRupiah(orderData.totalHarga)}
              </Typography>
            </div>
          </CardContent>
        </div>
      </Grid>

      {/* Action Buttons */}
      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            component={Link}
            href={subdomain === 'store' ? '/store' : `/s/${subdomain}`}
            variant="outlined"
            sx={{
              borderColor: primaryColor,
              color: primaryColor,
              '&:hover': { borderColor: `${primaryColor}dd`, bgcolor: `${primaryColor}08` },
              boxShadow: 'none !important'
            }}
          >
            Belanja Lagi
          </Button>
          <Button
            component={Link}
            href={subdomain === 'store' ? `/store/invoice/${orderUuid}` : `/s/${subdomain}/invoice/${orderUuid}`}
            target="_blank"
            variant="contained"
            sx={{ bgcolor: primaryColor, '&:hover': { bgcolor: `${primaryColor}dd` }, boxShadow: 'none !important' }}
          >
            Lihat Invoice
          </Button>
        </Box>
      </Grid>
    </Grid>
  )
}

export default StepConfirmation