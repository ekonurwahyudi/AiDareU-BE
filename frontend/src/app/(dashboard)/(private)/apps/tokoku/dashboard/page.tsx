'use client'

// React Imports
import { Suspense } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

// Component Imports
import DashboardClient from '@/views/apps/tokoku/dashboard/DashboardClient'

const EcommerceDashboard = () => {
  return (
    <RBACProvider>
      <Suspense fallback={
        <div className="flex justify-center items-center p-8">
          <CircularProgress />
        </div>
      }>
        <DashboardClient />
      </Suspense>
    </RBACProvider>
  )
}

export default EcommerceDashboard
