'use client'

// React Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

// Order Type
type Order = {
  uuid: string
  nomor_order: string
  created_at: string
  total_harga: number
  status: string
  ekspedisi: string
  estimasi_tiba?: string
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
    bank_name?: string
    nama_bank?: string
    account_number?: string
    nomor_rekening?: string
    account_holder_name?: string
    atas_nama?: string
  }
  bank_account?: {
    uuid: string
    bank_name?: string
    nama_bank?: string
    account_number?: string
    nomor_rekening?: string
    account_holder_name?: string
    atas_nama?: string
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
}

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

const InvoiceCard = ({ order }: { order: Order }) => {
  const router = useRouter()

  const handlePrint = () => {
    // Open invoice in new window for printing
    const invoiceUrl = `/apps/tokoku/orders/invoice/${order.uuid}`
    window.open(invoiceUrl, '_blank')
  }

  // Get bank account info (support both snake_case and camelCase)
  const bankInfo = order.bankAccount || order.bank_account
  const bankName = bankInfo?.bank_name || bankInfo?.nama_bank
  const accountNumber = bankInfo?.account_number || bankInfo?.nomor_rekening
  const accountHolderName = bankInfo?.account_holder_name || bankInfo?.atas_nama

  const subtotal = order.detailOrders?.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  ) || 0
  const ongkir = order.total_harga - subtotal

  return (
    <Card>
      <CardHeader
        title="Invoice"
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<i className="tabler-printer" />}
            onClick={handlePrint}
          >
            Print Invoice
          </Button>
        }
      />
      <CardContent className='flex flex-col gap-4'>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant='h6' className='font-medium'>
              Invoice #{order.nomor_order}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tanggal: {formatDate(order.created_at)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status: <span style={{ color: '#4caf50', fontWeight: 600 }}>{order.status || 'Pending'}</span>
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant='h6' className='font-medium'>
              Total
            </Typography>
            <Typography color='primary.main' className='font-bold text-xl'>
              {formatRupiah(order.total_harga)}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Customer & Payment Info */}
        <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant='h6' className='font-medium mb-2'>
              Informasi Pembeli
            </Typography>
            <Typography variant="body2">{order.customer?.nama || '-'}</Typography>
            <Typography variant="body2">{order.customer?.email || '-'}</Typography>
            <Typography variant="body2">{order.customer?.no_hp || '-'}</Typography>
            {order.customer?.alamat && order.customer.alamat !== '-' && (
              <>
                <Typography variant="body2" sx={{ mt: 1 }}>{order.customer.alamat}</Typography>
                <Typography variant="body2">
                  {order.customer.kecamatan}, {order.customer.kota}
                </Typography>
                <Typography variant="body2">{order.customer.provinsi}</Typography>
              </>
            )}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant='h6' className='font-medium mb-2'>
              Informasi Pembayaran
            </Typography>
            {bankInfo ? (
              <>
                <Typography variant="body2">
                  Bank: {bankName || '-'}
                </Typography>
                <Typography variant="body2">
                  Atas Nama: {accountHolderName || '-'}
                </Typography>
                <Typography variant="body2">
                  No. Rekening: <strong>{accountNumber || '-'}</strong>
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No payment information available
              </Typography>
            )}
            <Typography variant="body2" sx={{ mt: 1 }}>
              Ekspedisi: {order.ekspedisi || '-'}
            </Typography>
            {order.estimasi_tiba && (
              <Typography variant="body2">
                Estimasi: {order.estimasi_tiba}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Items Summary */}
        <Box>
          <Typography variant='h6' className='font-medium mb-2'>
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
            {order.detailOrders && order.detailOrders.length > 0 ? (
              order.detailOrders.map((item, index) => (
                <Box
                  key={item.uuid}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1fr 1fr 1fr',
                    gap: 2,
                    p: 2,
                    borderBottom: index < order.detailOrders!.length - 1 ? '1px solid #e0e0e0' : 'none'
                  }}
                >
                  <Typography variant="body2">{item.product?.nama_produk || 'Product'}</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'center' }}>{formatRupiah(item.price)}</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'center' }}>{item.quantity}</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 600 }}>
                    {formatRupiah(item.price * item.quantity)}
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No products found</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                {formatRupiah(order.total_harga)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Terima kasih atas pembelian Anda!
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Invoice ini dibuat secara otomatis oleh sistem
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default InvoiceCard
