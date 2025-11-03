'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

// Type Imports
import type { ThemeColor } from '@core/types'

// Order Type
type Order = {
  id: number
  uuid: string
  nomor_order: string
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  total_harga: number
}

type OrderStatusType = {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

const orderStatusObj: OrderStatusType = {
  pending: { title: 'Pending', color: 'warning' },
  processing: { title: 'Processing', color: 'info' },
  shipped: { title: 'Shipped', color: 'primary' },
  completed: { title: 'Completed', color: 'success' },
  cancelled: { title: 'Cancelled', color: 'error' }
}

const OrderDetailHeader = ({
  order,
  onScrollToStatus
}: {
  order: Order
  onScrollToStatus?: () => void
}) => {
  const statusConfig = orderStatusObj[order.status] || orderStatusObj.pending

  return (
    <div className='flex flex-wrap justify-between sm:items-center max-sm:flex-col gap-y-4'>
      <div className='flex flex-col items-start gap-1'>
        <div className='flex items-center gap-2'>
          <Typography variant='h5'>{order.nomor_order}</Typography>
          <Chip
            variant='tonal'
            label={statusConfig.title}
            color={statusConfig.color}
            size='small'
          />
        </div>
        <Typography variant="body2" color="text.secondary">
          {new Date(order.created_at).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Typography>
      </div>
      <div className="flex gap-3">
        <Button
          variant="contained"
          color="error"
          onClick={onScrollToStatus}
          startIcon={<i className="tabler-edit" />}
        >
          Update Status
        </Button>
        <Button
          variant="contained"
          color="warning"
          component={Link}
          href="/apps/tokoku/orders"
          startIcon={<i className="tabler-arrow-left" />}
        >
          Back to Orders
        </Button>
      </div>
    </div>
  )
}

export default OrderDetailHeader
