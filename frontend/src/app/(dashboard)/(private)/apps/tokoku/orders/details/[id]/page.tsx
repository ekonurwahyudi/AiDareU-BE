'use client'

// React Imports
import { Suspense, use } from 'react'

// MUI Imports
import CircularProgress from '@mui/material/CircularProgress'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

// Component Imports
import OrderDetails from '@/views/apps/tokoku/orders/details'

const OrderDetailsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params)

  return (
    <RBACProvider>
      <Suspense fallback={
        <div className="flex justify-center items-center p-8">
          <CircularProgress />
        </div>
      }>
        <OrderDetails orderId={id} />
      </Suspense>
    </RBACProvider>
  )
}

export default OrderDetailsPage
