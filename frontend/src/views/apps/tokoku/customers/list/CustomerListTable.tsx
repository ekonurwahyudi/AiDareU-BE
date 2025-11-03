'use client'

// React Imports
import { useEffect, useMemo, useState, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

// Hook Imports
import { useDebounce } from '@/hooks/useDebounce'

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

type Customer = {
  id: number
  uuid: string
  nama: string
  no_hp: string
  email: string | null
  provinsi: string
  kota: string
  kecamatan: string
  alamat: string
  uuid_store: string
  created_at: string
  updated_at: string
}

type CustomerWithActionsType = Customer & {
  action?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

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

// Column Definitions
const columnHelper = createColumnHelper<CustomerWithActionsType>()

const CustomerListTable = () => {
  // RBAC Context
  const { currentStore, isLoading: rbacLoading } = useRBAC()

  // States
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [totalRows, setTotalRows] = useState(0)

  const debouncedSearch = useDebounce(globalFilter, 300)

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    const storeUuid = currentStore?.uuid || currentStore?.id
    if (!storeUuid) {
      console.warn('No current store UUID available for fetching customers')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      queryParams.append('page', String(pagination.pageIndex + 1))
      queryParams.append('per_page', String(pagination.pageSize))

      if (debouncedSearch) {
        queryParams.append('search', debouncedSearch)
      }

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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const response = await fetch(`${apiUrl}/stores/${storeUuid}/customers?${queryParams.toString()}`, {
        credentials: 'include',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        setCustomers(result.data.data || [])
        setTotalRows(result.data.total || 0)
      } else {
        throw new Error(result.message || 'Failed to fetch customers')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
      console.error('Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }, [currentStore?.uuid, currentStore?.id, debouncedSearch, pagination.pageIndex, pagination.pageSize])

  // Fetch customers when dependencies change
  useEffect(() => {
    if (currentStore && !rbacLoading) {
      fetchCustomers()
    }
  }, [fetchCustomers, currentStore, rbacLoading])

  // Columns
  const columns = useMemo<ColumnDef<CustomerWithActionsType, any>[]>(() => [
    columnHelper.accessor('id', {
      header: 'No',
      cell: ({ row }) => (
        <Typography color="text.primary">
          {pagination.pageIndex * pagination.pageSize + row.index + 1}
        </Typography>
      )
    }),
    columnHelper.accessor('nama', {
      header: 'Nama',
      cell: ({ row }) => (
        <Typography color="text.primary" className="font-medium">
          {row.original.nama}
        </Typography>
      )
    }),
    columnHelper.accessor('no_hp', {
      header: 'No HP',
      cell: ({ row }) => (
        <Typography>{row.original.no_hp}</Typography>
      )
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: ({ row }) => (
        <Typography>{row.original.email || '-'}</Typography>
      )
    }),
    columnHelper.accessor('kota', {
      header: 'Kota',
      cell: ({ row }) => (
        <Typography>{row.original.kota}</Typography>
      )
    }),
    columnHelper.accessor('alamat', {
      header: 'Alamat',
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <Typography sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
            {row.original.alamat}
          </Typography>
        </div>
      )
    })
  ], [pagination.pageIndex, pagination.pageSize])

  // Table setup
  const table = useReactTable({
    data: customers,
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
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: Math.ceil(totalRows / pagination.pageSize)
  })

  // Skeleton loading component
  const renderSkeleton = () => (
    <Card>
      <CardHeader
        title={<Skeleton variant="text" width={150} height={32} />}
        action={
          <div className="flex gap-3">
            <Skeleton variant="rounded" width={100} height={40} />
          </div>
        }
      />
      <Divider />
      <CardContent>
        {/* Filter row skeleton */}
        <div className="flex justify-between items-center mb-4">
          <Skeleton variant="rounded" width={80} height={40} />
          <Skeleton variant="rounded" width={200} height={40} />
        </div>
        {/* Table skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <Skeleton variant="rectangular" width={40} height={20} />
              <Skeleton variant="text" width={50} />
              <Skeleton variant="text" width={150} />
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={180} />
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={200} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // Show loading state
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
      <CardHeader
        title="Customer List"
        action={
          <div className="flex gap-3">
            <Button
              variant="outlined"
              startIcon={<i className="tabler-refresh" />}
              onClick={() => fetchCustomers()}
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

          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={val => setGlobalFilter(String(val))}
            placeholder="Search Customer"
            className="w-[200px]"
          />
        </div>

        {/* Table */}
        {loading && customers.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton variant="rectangular" width={40} height={20} />
                <Skeleton variant="text" width={50} />
                <Skeleton variant="text" width={150} />
                <Skeleton variant="text" width={120} />
                <Skeleton variant="text" width={180} />
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={200} />
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
            {customers.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                    {loading ? 'Loading...' : 'No customers found'}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
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

export default CustomerListTable
