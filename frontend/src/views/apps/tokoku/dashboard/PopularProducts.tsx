// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Components Imports
import OptionMenu from '@core/components/option-menu'

interface PopularProduct {
  uuid: string
  name: string
  image: string | null
  total_sold: number
  revenue: number
}

interface PopularProductsProps {
  products?: PopularProduct[] | null
}

const PopularProducts = ({ products }: PopularProductsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Parse image from JSON string
  const getFirstImage = (imageJson: string | null) => {
    if (!imageJson) return '/images/cards/product-placeholder.png'

    try {
      const images = JSON.parse(imageJson)

      if (Array.isArray(images) && images.length > 0) {
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${images[0]}`
      }
    } catch (e) {
      console.error('Error parsing image JSON:', e)
    }

    return '/images/cards/product-placeholder.png'
  }

  const totalVisitors = products?.reduce((sum, product) => sum + product.total_sold, 0) || 0

  return (
    <Card>
      <CardHeader
        title='Produk Populer'
        subheader={`Total ${totalVisitors} Terjual`}
        action={<OptionMenu options={['Harga - rendah ke tinggi', 'Harga - tinggi ke rendah', 'Terlaris']} />}
      />
      <CardContent className='flex flex-col gap-[1.638rem]'>
        {!products || products.length === 0 ? (
          <Typography variant='body2' color='text.secondary'>
            Belum ada data produk populer
          </Typography>
        ) : (
          products.map((item, index) => (
            <div key={item.uuid} className='flex items-center gap-4'>
              <img
                src={getFirstImage(item.image)}
                alt={item.name}
                width={46}
                height={46}
                className='rounded object-cover flex-shrink-0'
                onError={(e: any) => {
                  e.target.src = '/images/cards/product-placeholder.png'
                }}
              />
              <div className='flex justify-between items-center gap-x-4 is-full min-w-0'>
                <div className='flex flex-col flex-1 min-w-0'>
                  <Typography className='font-medium truncate' color='text.primary' title={item.name}>
                    {item.name}
                  </Typography>
                  <Typography variant='body2' className='truncate'>{`Terjual: ${item.total_sold} item`}</Typography>
                </div>
                <Typography className='font-medium whitespace-nowrap flex-shrink-0'>{formatCurrency(item.revenue)}</Typography>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default PopularProducts
