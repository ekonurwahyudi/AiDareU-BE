// React Imports
import { Suspense } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'

// Component Imports
import EcommerceDashboard from '../../apps/tokoku/dashboard/page'
import StoreSetupChecker from '@components/store-setup/StoreSetupChecker'

// Skeleton Component
const DashboardSkeleton = () => (
  <Grid container spacing={6}>
    <Grid size={{ xs: 12, md: 4 }}>
      <Card>
        <CardContent className='flex flex-col gap-4'>
          <Skeleton variant='text' width={180} height={28} />
          <Skeleton variant='text' width='100%' height={24} />
          <Skeleton variant='text' width='80%' height={24} />
          <Skeleton variant='rounded' width='100%' height={120} />
          <Skeleton variant='rounded' width={140} height={40} />
        </CardContent>
      </Card>
    </Grid>
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <Skeleton variant='text' width={120} height={24} />
            <Skeleton variant='circular' width={40} height={40} />
          </div>
          <Skeleton variant='text' width={100} height={40} />
          <Skeleton variant='text' width='80%' height={20} />
        </CardContent>
      </Card>
    </Grid>
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <Skeleton variant='text' width={120} height={24} />
            <Skeleton variant='circular' width={40} height={40} />
          </div>
          <Skeleton variant='text' width={100} height={40} />
          <Skeleton variant='text' width='80%' height={20} />
        </CardContent>
      </Card>
    </Grid>
    <Grid size={{ xs: 12, md: 8 }}>
      <Card>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <Skeleton variant='text' width={150} height={28} />
            <Skeleton variant='rounded' width={100} height={32} />
          </div>
          <Skeleton variant='rounded' width='100%' height={300} />
        </CardContent>
      </Card>
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <Card>
        <CardContent className='flex flex-col gap-4'>
          <Skeleton variant='text' width={150} height={28} />
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex items-center gap-4'>
              <Skeleton variant='rounded' width={60} height={60} />
              <div className='flex-1'>
                <Skeleton variant='text' width='100%' height={20} />
                <Skeleton variant='text' width='60%' height={20} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Grid>
    <Grid size={{ xs: 12 }}>
      <Card>
        <CardContent className='flex flex-col gap-4'>
          <Skeleton variant='text' width={180} height={28} />
          <Skeleton variant='rounded' width='100%' height={400} />
        </CardContent>
      </Card>
    </Grid>
  </Grid>
)

const DashboardECommerce = () => {
  return (
    <StoreSetupChecker>
      <Suspense fallback={<DashboardSkeleton />}>
        <EcommerceDashboard />
      </Suspense>
    </StoreSetupChecker>
  )
}

export default DashboardECommerce
