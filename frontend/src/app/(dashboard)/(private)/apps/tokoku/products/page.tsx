'use client'

// React Imports
import { Suspense } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

// Component Imports
import ProductListTable from '@/views/apps/tokoku/products/list/ProductListTable'
import ProductCard from '@/views/apps/tokoku/products/list/ProductCard'

const eCommerceProductsList = () => {
  return (
    <RBACProvider>
      <Grid container spacing={6}>
        {/* <Grid size={{ xs: 12 }}>
          <ProductCard />
        </Grid> */}
        <Grid size={{ xs: 12 }}>
          <Suspense fallback={
            <div className="flex justify-center items-center p-8">
              <CircularProgress />
            </div>
          }>
            <ProductListTable />
          </Suspense>
        </Grid>
      </Grid>
    </RBACProvider>
  )
}

export default eCommerceProductsList
