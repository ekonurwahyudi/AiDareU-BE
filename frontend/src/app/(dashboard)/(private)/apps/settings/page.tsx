// React Imports
import type { ReactElement } from 'react'
import { Suspense } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'

// Type Imports
import type { PricingPlanType } from '@/types/pages/pricingTypes'

// Component Imports
import UserLeftOverview from '@views/apps/user/view/user-left-overview'
import UserRight from '@views/apps/user/view/user-right'

// Data Imports
import { getPricingData, getUserStoreUuid } from '@/app/server/actions'

const OverViewTab = dynamic(() => import('@views/apps/user/view/user-right/overview'))
const KaryawanTab = dynamic(() => import('@/views/apps/user/view/user-right/karyawan'))
const BillingPlans = dynamic(() => import('@views/apps/user/view/user-right/billing-plans'))
const NotificationsTab = dynamic(() => import('@views/apps/user/view/user-right/notifications'))
const ConnectionsTab = dynamic(() => import('@views/apps/user/view/user-right/connections'))

// Skeleton Components
const SettingsLeftSkeleton = () => (
  <Card>
    <CardContent className='flex flex-col gap-6 pbs-12'>
      <div className='flex items-center justify-center flex-col gap-4'>
        <Skeleton variant='rounded' width={120} height={120} />
        <Skeleton variant='text' width={150} height={32} />
        <Skeleton variant='rounded' width={100} height={24} />
      </div>
      <div className='flex items-center justify-around flex-wrap gap-4'>
        <div className='flex items-center gap-4'>
          <Skeleton variant='rounded' width={40} height={40} />
          <div>
            <Skeleton variant='text' width={60} height={28} />
            <Skeleton variant='text' width={80} height={20} />
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <Skeleton variant='rounded' width={40} height={40} />
          <div>
            <Skeleton variant='text' width={100} height={28} />
            <Skeleton variant='text' width={120} height={20} />
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-3'>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} variant='text' width='100%' height={24} />
        ))}
      </div>
      <Skeleton variant='rounded' width='100%' height={40} />
    </CardContent>
  </Card>
)

const SettingsRightSkeleton = () => (
  <Card>
    <CardContent className='flex flex-col gap-6'>
      <div className='flex gap-4 border-b pb-4'>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant='rounded' width={100} height={36} />
        ))}
      </div>
      <div className='flex flex-col gap-4'>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant='rounded' width='100%' height={80} />
        ))}
      </div>
    </CardContent>
  </Card>
)

const SettingsSkeleton = () => (
  <Grid container spacing={6}>
    <Grid size={{ xs: 12, lg: 4, md: 5 }}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <SettingsLeftSkeleton />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent className='flex flex-col gap-4'>
              <Skeleton variant='text' width={150} height={28} />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant='rounded' width='100%' height={60} />
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
    <Grid size={{ xs: 12, lg: 8, md: 7 }}>
      <SettingsRightSkeleton />
    </Grid>
  </Grid>
)

// Vars
const tabContentList = (data?: PricingPlanType[], storeUuid?: string | null): { [key: string]: ReactElement } => ({
  overview: <OverViewTab storeUuid={storeUuid} />,
  security: <KaryawanTab />,
  'billing-plans': <BillingPlans data={data} storeUuid={storeUuid} />,
  notifications: <NotificationsTab />,
  connections: <ConnectionsTab storeUuid={storeUuid} />
})

/**
 * ! If you need data using an API call, uncomment the below API code, update the `process.env.API_URL` variable in the
 * ! `.env` file found at root of your project and also update the API endpoints like `/pages/pricing` in below example.
 * ! Also, remove the above server action import and the action itself from the `src/app/server/actions.ts` file to clean up unused code
 * ! because we've used the server action for getting our static data.
 */

/* const getPricingData = async () => {
  // Vars
  const res = await fetch(`${process.env.API_URL}/pages/pricing`)

  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }

  return res.json()
} */

const UserViewTab = async () => {
  // Vars
  const [data, storeUuid] = await Promise.all([getPricingData(), getUserStoreUuid()])

  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, lg: 4, md: 5 }}>
          <UserLeftOverview />
        </Grid>
        <Grid size={{ xs: 12, lg: 8, md: 7 }}>
          <UserRight tabContentList={tabContentList(data, storeUuid)} />
        </Grid>
      </Grid>
    </Suspense>
  )
}

export default UserViewTab
