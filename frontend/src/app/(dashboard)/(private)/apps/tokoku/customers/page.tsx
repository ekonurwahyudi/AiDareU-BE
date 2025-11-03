'use client'

import { Suspense } from 'react'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'

import CustomerListTable from '@/views/apps/tokoku/customers/list/CustomerListTable'
import { RBACProvider } from '@/contexts/rbacContext'

const CustomerListTablePage = () => {
  return (
    <RBACProvider>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <Suspense fallback={<CircularProgress />}>
            <CustomerListTable />
          </Suspense>
        </Grid>
      </Grid>
    </RBACProvider>
  )
}

export default CustomerListTablePage
