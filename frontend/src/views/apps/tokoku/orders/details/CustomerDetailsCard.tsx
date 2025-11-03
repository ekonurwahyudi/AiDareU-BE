'use client'

// React Imports
import React from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Order Status Config
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

// Order Type
type Order = {
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  customer?: {
    uuid: string
    nama: string
    email?: string
    no_hp: string
    provinsi?: string
    kota?: string
    kecamatan?: string
    alamat?: string
  }
}

const CustomerDetailsCard = ({ order, onStatusUpdate }: { order: Order; onStatusUpdate: (status: Order['status']) => Promise<void> }) => {
  const customer = order.customer
  const [selectedStatus, setSelectedStatus] = React.useState<Order['status']>(order.status)
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Update selectedStatus when order.status changes
  React.useEffect(() => {
    setSelectedStatus(order.status)
  }, [order.status])

  const handleUpdateStatus = async () => {
    if (selectedStatus === order.status) return

    setIsUpdating(true)
    try {
      await onStatusUpdate(selectedStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
      // Reset to original status on error
      setSelectedStatus(order.status)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!customer) {
    return (
      <Card>
        <CardHeader title="Customer Details" />
        <CardContent>
          <Typography color="text.secondary">No customer information available</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Customer Details" />
      <CardContent className='flex flex-col gap-6'>
        <div className='flex items-center gap-3'>
          <CustomAvatar skin='light' size={50}>
            {getInitials(customer.nama)}
          </CustomAvatar>
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {customer.nama}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {customer.uuid.substring(0, 8)}...
            </Typography>
          </div>
        </div>

        <Divider />

        <div className='flex flex-col gap-3'>
          <Typography variant='h6' className='font-medium'>
            Contact Info
          </Typography>

          <div className='flex items-start gap-2'>
            <i className='tabler-mail text-xl text-textSecondary' />
            <div className='flex flex-col'>
              <Typography variant="body2" color="text.secondary">Email</Typography>
              <Typography color='text.primary'>
                {customer.email || '-'}
              </Typography>
            </div>
          </div>

          <div className='flex items-start gap-2'>
            <i className='tabler-phone text-xl text-textSecondary' />
            <div className='flex flex-col'>
              <Typography variant="body2" color="text.secondary">Phone</Typography>
              <Typography color='text.primary'>
                {customer.no_hp}
              </Typography>
            </div>
          </div>
        </div>

        {(customer.provinsi || customer.kota || customer.alamat) && (
          <>
            <Divider />
            <div className='flex flex-col gap-3'>
              <Typography variant='h6' className='font-medium'>
                Shipping Address
              </Typography>

              <div className='flex items-start gap-2'>
                <i className='tabler-map-pin text-xl text-textSecondary' />
                <div className='flex flex-col'>
                  <Typography color='text.primary'>
                    {customer.alamat}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[customer.kecamatan, customer.kota, customer.provinsi]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                </div>
              </div>
            </div>
          </>
        )}

        <Divider />

        <div id="status-update-section" className='flex flex-col gap-3'>
          <Typography variant='h6' className='font-medium'>
            Update Status
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Order Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Order Status"
              onChange={(e) => setSelectedStatus(e.target.value as Order['status'])}
              renderValue={(value) => {
                const statusConfig = orderStatusObj[value]
                return (
                  <Chip
                    variant='tonal'
                    label={statusConfig.title}
                    color={statusConfig.color}
                    size='small'
                  />
                )
              }}
            >
              {Object.entries(orderStatusObj).map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  <Typography component="span" className="flex items-center gap-2">
                    <Chip
                      variant='tonal'
                      label={config.title}
                      color={config.color}
                      size='small'
                    />
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={handleUpdateStatus}
            disabled={isUpdating || selectedStatus === order.status}
            startIcon={isUpdating ? <i className="tabler-loader" /> : <i className="tabler-check" />}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomerDetailsCard
