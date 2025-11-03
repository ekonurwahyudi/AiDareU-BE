'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

// Component Imports
import { ProductPlaceholder } from '@/components/ProductPlaceholder'

// Order Type
type Order = {
  total_harga: number
  ekspedisi: string
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

// Utility function to generate proper image URLs
const getImageUrl = (imagePath: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  return `${baseUrl}/storage/${imagePath}`
}

// Utility function to extract images from product data
const getProductImages = (imageData: any): string[] => {
  if (!imageData) return []

  if (typeof imageData === 'string') {
    try {
      const parsed = JSON.parse(imageData)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return [imageData]
    }
  }

  return Array.isArray(imageData) ? imageData : []
}

const OrderDetailsCard = ({ order }: { order: Order }) => {
  // Calculate subtotal
  const subtotal = order.detailOrders?.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0) || 0

  // For now, we'll set shipping fee to 0 since it's included in total_harga
  const shippingFee = 0

  return (
    <Card>
      <CardHeader title='Order Details' />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="center">SKU</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.detailOrders && order.detailOrders.length > 0 ? (
                order.detailOrders.map((item) => {
                  const images = getProductImages(item.product?.upload_gambar_produk)
                  const mainImagePath = images.length > 0 ? images[0] : null
                  const imageUrl = mainImagePath ? getImageUrl(mainImagePath) : null

                  return (
                    <TableRow key={item.uuid}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.product?.nama_produk || 'Product'}
                              width={50}
                              height={50}
                              className='rounded bg-actionHover object-cover'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <ProductPlaceholder width={50} height={50} />
                          )}
                          <div className='flex flex-col'>
                            <Typography className='font-medium' color='text.primary'>
                              {item.product?.nama_produk || 'Unknown Product'}
                            </Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">
                          {item.product?.sku || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography>
                          Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography>{item.quantity}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography className="font-medium">
                          Rp {new Intl.NumberFormat('id-ID').format(item.price * item.quantity)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">No products found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider className="my-4" />

        <div className='flex justify-end'>
          <div className="min-w-[300px]">
            <div className='flex justify-between items-center mb-2'>
              <Typography color='text.primary'>Subtotal:</Typography>
              <Typography color='text.primary' className='font-medium'>
                Rp {new Intl.NumberFormat('id-ID').format(subtotal)}
              </Typography>
            </div>
            <div className='flex justify-between items-center mb-2'>
              <Typography color='text.primary'>Shipping ({order.ekspedisi}):</Typography>
              <Typography color='text.primary' className='font-medium'>
                {shippingFee > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(shippingFee)}` : 'Included'}
              </Typography>
            </div>
            <Divider className="my-2" />
            <div className='flex justify-between items-center'>
              <Typography color='text.primary' className='font-medium text-lg'>
                Total:
              </Typography>
              <Typography color='primary.main' className='font-bold text-lg'>
                Rp {new Intl.NumberFormat('id-ID').format(order.total_harga)}
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderDetailsCard
