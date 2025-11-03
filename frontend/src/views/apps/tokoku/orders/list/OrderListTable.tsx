'use client'

// React Imports
import { useEffect, useMemo, useState, useCallback } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { ThemeColor } from '@core/types'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

// Hook Imports
import { useDebounce } from '@/hooks/useDebounce'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Utility function
import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

// Order Type
type Order = {
  id: number
  uuid: string
  uuid_store: string
  uuid_customer: string
  nomor_order: string
  voucher?: string
  total_harga: number
  ekspedisi: string
  estimasi_tiba?: string
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  uuid_bank_account: string
  created_at: string
  updated_at: string
  customer?: {
    uuid: string
    nama: string
    email?: string
    no_hp: string
  }
  detailOrders?: Array<{
    uuid: string
    quantity: number
    price: number
    product?: {
      nama_produk: string
      upload_gambar_produk?: string | string[]
    }
  }>
}

type OrderWithActionsType = Order & {
  actions?: string
}

type OrderStatusType = {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

type PaymentStatusType = {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

// Custom filter
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

// Debounced input for search
const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)
    return () => clearTimeout(timeout)
  }, [value, onChange, debounce])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Vars
const orderStatusObj: OrderStatusType = {
  pending: { title: 'Pending', color: 'warning' },
  processing: { title: 'Processing', color: 'info' },
  shipped: { title: 'Shipped', color: 'primary' },
  completed: { title: 'Completed', color: 'success' },
  cancelled: { title: 'Cancelled', color: 'error' }
}

// Column Definitions
const columnHelper = createColumnHelper<OrderWithActionsType>()

const OrderListTable = () => {
  // Next.js hooks
  const router = useRouter()

  // RBAC Context
  const { currentStore, user, isLoading: rbacLoading } = useRBAC()

  // States
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [totalRows, setTotalRows] = useState(0)

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all')

  // Reduced debouncing for faster response
  const debouncedSearch = useDebounce(globalFilter, 200)
  const debouncedStatusFilter = useDebounce(statusFilter, 100)

  // Fetch orders from API
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    const storeUuid = currentStore?.uuid || currentStore?.id
    if (!storeUuid) {
      console.warn('No current store UUID available for fetching orders')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

      // Build query params
      const queryParams = new URLSearchParams()
      if (debouncedSearch) {
        queryParams.append('search', debouncedSearch)
      }
      if (debouncedStatusFilter !== 'all') {
        queryParams.append('status', debouncedStatusFilter)
      }
      queryParams.append('page', String(pagination.pageIndex + 1))
      queryParams.append('per_page', String(pagination.pageSize))

      // Get auth headers
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (storedUserData) {
        const userData = JSON.parse(storedUserData)
        if (userData.uuid) {
          headers['X-User-UUID'] = userData.uuid
        }
      }

      const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : ''
      const cacheControl = forceRefresh ? 'no-cache' : 'default'

      const response = await fetch(
        `${apiUrl}/stores/${storeUuid}/orders?${queryParams.toString()}${cacheBuster}`,
        {
          credentials: 'include',
          cache: cacheControl as RequestCache,
          headers
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      console.log('Orders fetched successfully:', result)
      if (result.success) {
        // Normalize data - convert detail_orders to detailOrders if needed
        const ordersData = (result.data.data || []).map((order: any) => {
          if (order.detail_orders && !order.detailOrders) {
            return { ...order, detailOrders: order.detail_orders }
          }
          return order
        })
        setOrders(ordersData)
        setTotalRows(result.data.total || 0)
      } else {
        throw new Error(result.message || 'Failed to fetch orders')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      console.error('Error fetching orders for store UUID:', storeUuid, err)
    } finally {
      setLoading(false)
    }
  }, [currentStore?.uuid, currentStore?.id, debouncedSearch, debouncedStatusFilter, pagination])

  // Fetch orders when dependencies change
  useEffect(() => {
    if (currentStore && !rbacLoading) {
      // Check if we need to force refresh after status update
      const shouldRefresh = sessionStorage.getItem('orderStatusUpdated')
      if (shouldRefresh === 'true') {
        console.log('Status was updated, force refreshing orders...')
        sessionStorage.removeItem('orderStatusUpdated')
        fetchOrders(true) // Force refresh with cache buster
      } else {
        fetchOrders()
      }
    }
  }, [fetchOrders, currentStore, rbacLoading])

  // Auto-refresh when page becomes visible (user returns from detail page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentStore && !rbacLoading) {
        console.log('Page became visible, refreshing orders...')
        fetchOrders(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentStore, rbacLoading, fetchOrders])

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    fetchOrders(true)
  }, [fetchOrders])

  // Handle status update
  const handleStatusUpdate = async (order: Order, newStatus: Order['status']) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const response = await fetch(`${apiUrl}/order/${order.uuid}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        fetchOrders(true)
      } else {
        throw new Error(result.message || 'Failed to update order status')
      }
    } catch (err) {
      console.error('Error updating order status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update order status')
    }
  }

  // Get avatar for customer
  const getAvatar = (customer?: Order['customer']) => {
    if (!customer) {
      return (
        <CustomAvatar skin='light' size={34}>
          <i className="tabler-user" />
        </CustomAvatar>
      )
    }

    return (
      <CustomAvatar skin='light' size={34}>
        {getInitials(customer.nama)}
      </CustomAvatar>
    )
  }

  // Calculate total items from order details
  const getTotalItems = (detailOrders?: Order['detailOrders']) => {
    if (!detailOrders || detailOrders.length === 0) return 0
    return detailOrders.reduce((sum, detail) => sum + detail.quantity, 0)
  }

  // Columns
  const columns = useMemo<ColumnDef<OrderWithActionsType, any>[]>(() => [
    columnHelper.accessor('id', {
      header: 'No',
      cell: ({ row }) => (
        <Typography color="text.primary">
          {pagination.pageIndex * pagination.pageSize + row.index + 1}
        </Typography>
      )
    }),
    columnHelper.accessor('nomor_order', {
      header: 'Order',
      cell: ({ row }) => (
        <Typography
          component={Link}
          href={`/apps/tokoku/orders/details/${row.original.uuid}`}
          color='primary.main'
          className="font-medium hover:underline"
        >
          #{row.original.nomor_order}
        </Typography>
      )
    }),
    columnHelper.accessor('created_at', {
      header: 'Tanggal',
      cell: ({ row }) => {
        const date = new Date(row.original.created_at)
        return (
          <Typography>
            {date.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
            <br />
            {/* <Typography variant="body2" color="text.secondary">
              {date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography> */}
          </Typography>
        )
      }
    }),
    columnHelper.accessor('customer', {
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original.customer
        return (
          <div className='flex items-center gap-3'>
            {getAvatar(customer)}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {customer?.nama || 'Unknown'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {customer?.email || customer?.no_hp || '-'}
              </Typography>
            </div>
          </div>
        )
      }
    }),
    columnHelper.accessor('detailOrders', {
      header: 'Items',
      cell: ({ row }) => (
        <Typography>
          {getTotalItems(row.original.detailOrders)} item(s)
        </Typography>
      )
    }),
    columnHelper.accessor('total_harga', {
      header: 'Total Harga',
      cell: ({ row }) => (
        <Typography className="font-medium">
          Rp {new Intl.NumberFormat('id-ID').format(row.original.total_harga)}
        </Typography>
      )
    }),
    columnHelper.accessor('ekspedisi', {
      header: 'Ekspedisi',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Typography color='text.primary'>
            {row.original.ekspedisi}
          </Typography>
          {row.original.estimasi_tiba && (
            <Typography variant='body2' color='text.secondary'>
              {row.original.estimasi_tiba}
            </Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const statusConfig = orderStatusObj[status] || orderStatusObj.pending

        return (
          <Chip
            variant="tonal"
            size="small"
            color={statusConfig.color}
            label={statusConfig.title}
          />
        )
      },
      enableSorting: false
    }),
    columnHelper.accessor('actions', {
      header: 'Aksi',
      cell: ({ row }) => (
        <IconButton
          component={Link}
          href={`/apps/tokoku/orders/details/${row.original.uuid}`}
          title="View Details"
          color="primary"
        >
          <i className="tabler-eye" />
        </IconButton>
      ),
      enableSorting: false
    })
  ], [pagination.pageIndex, pagination.pageSize, handleStatusUpdate])

  // Table setup with server-side pagination
  const table = useReactTable({
    data: orders,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: {
      globalFilter,
      pagination
    },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: Math.ceil(totalRows / pagination.pageSize)
  })

  // Show loading or error states
  // Skeleton loading component
  const renderSkeleton = () => (
    <Card>
      <CardHeader
        title={<Skeleton variant="text" width={100} height={32} />}
        action={<Skeleton variant="rounded" width={120} height={40} />}
      />
      <Divider />
      <CardContent>
        {/* Filter row skeleton */}
        <div className="flex justify-between items-center mb-4">
          <Skeleton variant="rounded" width={80} height={40} />
          <div className="flex gap-3">
            <Skeleton variant="rounded" width={200} height={40} />
            <Skeleton variant="rounded" width={150} height={40} />
          </div>
        </div>
        {/* Table skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <Skeleton variant="rectangular" width={40} height={20} />
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={150} />
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width={80} />
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={100} />
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="circular" width={32} height={32} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (rbacLoading) {
    return renderSkeleton()
  }

  if (!currentStore) {
    return (
      <Card>
        <div className="text-center p-8">
          <Alert severity="warning">
            No store found. Please create a store first.
          </Alert>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      {/* Header */}
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Typography variant="h5">Orders</Typography>
            {loading && orders.length > 0 && (
              <CircularProgress size={16} className="text-primary" />
            )}
          </div>
        }
        action={
          <div className="flex gap-3">
            <Button
              variant="outlined"
              startIcon={<i className="tabler-refresh" />}
              onClick={handleManualRefresh}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        }
      />

      <Divider />

      {error && (
        <Alert severity="error" className="m-6">
          {error}
        </Alert>
      )}

      {/* Filter Row */}
      <CardContent>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          {/* Left: Show entries */}
          <CustomTextField
            select
            value={pagination.pageSize}
            onChange={e => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
            className="w-[80px]"
          >
            <MenuItem value="10">10</MenuItem>
            <MenuItem value="25">25</MenuItem>
            <MenuItem value="50">50</MenuItem>
          </CustomTextField>

          {/* Right: Search + Filter */}
          <div className="flex gap-3 items-center">
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={val => setGlobalFilter(String(val))}
              placeholder="Search Order"
              className="w-[200px]"
            />

            <CustomTextField
              select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-[150px]"
            >
              <MenuItem value="all">All Status</MenuItem>
              {Object.entries(orderStatusObj).map(([key, status]) => (
                <MenuItem key={key} value={key}>{status.title}</MenuItem>
              ))}
            </CustomTextField>
          </div>
        </div>

        {/* Table */}
        {loading && orders.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton variant="rectangular" width={40} height={20} />
                <Skeleton variant="text" width={120} />
                <Skeleton variant="text" width={150} />
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="text" width={80} />
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={100} />
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="circular" width={32} height={32} />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({
                            'flex items-center': header.column.getIsSorted(),
                            'cursor-pointer select-none': header.column.getCanSort()
                          })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <i className="tabler-chevron-up text-xl" />,
                            desc: <i className="tabler-chevron-down text-xl" />
                          }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {orders.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                    {loading ? 'Loading...' : 'No orders found'}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        )}
      </CardContent>

      {/* Pagination */}
      <TablePagination
        component={() => <TablePaginationComponent table={table} />}
        count={totalRows}
        rowsPerPage={pagination.pageSize}
        page={pagination.pageIndex}
        onPageChange={(_, page) => {
          setPagination(prev => ({ ...prev, pageIndex: page }))
        }}
      />
    </Card>
  )
}

export default OrderListTable
