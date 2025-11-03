// React Imports
import { Suspense } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'

// Component Imports
import ProductDigitalList from '@/views/apps/products-digital'

// Type Imports
import type { ProductDigital } from '@/views/apps/products-digital/ProductDigitalCard'

// Skeleton Component
const ProductDigitalSkeleton = () => (
  <Card>
    <CardContent className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <Skeleton variant='text' width={200} height={32} />
          <Skeleton variant='text' width={180} height={24} />
        </div>
        <div className='flex flex-wrap items-center gap-y-4 gap-x-4'>
          <Skeleton variant='rounded' width={250} height={40} />
          <Skeleton variant='rounded' width={130} height={40} />
        </div>
      </div>
      <Grid container spacing={6}>
        {[...Array(6)].map((_, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <div className='border rounded'>
              <div className='pli-2 pbs-2'>
                <Skeleton variant='rounded' width='100%' height={200} />
              </div>
              <div className='flex flex-col gap-4 p-5'>
                <div className='flex items-center gap-2'>
                  <Skeleton variant='rounded' width={80} height={24} />
                  <Skeleton variant='rounded' width={70} height={24} />
                </div>
                <div className='flex flex-col gap-1'>
                  <Skeleton variant='text' width='100%' height={28} />
                  <Skeleton variant='text' width='100%' height={20} />
                  <Skeleton variant='text' width='80%' height={20} />
                </div>
                <div className='flex flex-wrap gap-4'>
                  <Skeleton variant='rounded' width='48%' height={40} />
                  <Skeleton variant='rounded' width='48%' height={40} />
                </div>
              </div>
            </div>
          </Grid>
        ))}
      </Grid>
      <div className='flex justify-center'>
        <Skeleton variant='rounded' width={300} height={40} />
      </div>
    </CardContent>
  </Card>
)

const getProductsDigital = async (): Promise<{ products: ProductDigital[] }> => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/products-digital`, {
      cache: 'no-store'
    })

    if (!res.ok) {
      throw new Error('Failed to fetch products digital')
    }

    const response = await res.json()

    return { products: response.data || [] }
  } catch (error) {
    console.error('Error fetching products digital:', error)
    return { products: [] }
  }
}

const ProductsDigitalPage = async () => {
  const data = await getProductsDigital()

  return (
    <Suspense fallback={<ProductDigitalSkeleton />}>
      <ProductDigitalList productData={data?.products} />
    </Suspense>
  )
}

export default ProductsDigitalPage
