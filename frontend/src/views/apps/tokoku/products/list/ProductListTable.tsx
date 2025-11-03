'use client'

// React Imports
import { useEffect, useMemo, useState, useCallback } from 'react'

// Next Imports
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
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
import type { Product, Category } from '@/types/product'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

// Hook Imports
import { useDebounce } from '@/hooks/useDebounce'

// API Imports
import { productApi } from '@/services/productApi'

// Excel Export
import * as XLSX from 'xlsx'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'
import { ProductPlaceholder } from '@/components/ProductPlaceholder'

// Utility function to generate proper image URLs
const getImageUrl = (imagePath: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  return `${baseUrl}/storage/${imagePath}`
}

// Utility function to extract images from product data
const getProductImages = (imageData: any): string[] => {
  if (!imageData) return []
  
  if (typeof imageData === 'string') {
    try {
      const parsed = JSON.parse(imageData)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return [imageData]
    }
  }
  
  return Array.isArray(imageData) ? imageData : []
}

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

type ProductWithActionsType = Product & {
  actions?: string
}

type ProductCategoryType = {
  [key: string]: {
    icon: string
    color: ThemeColor
  }
}

type productStatusType = {
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
const productCategoryObj: ProductCategoryType = {
  'Elektronik': { icon: 'tabler-device-laptop', color: 'primary' },
  'Fashion': { icon: 'tabler-shirt', color: 'secondary' },
  'Makanan & Minuman': { icon: 'tabler-pizza', color: 'success' },
  'Kesehatan & Kecantikan': { icon: 'tabler-heart-handshake', color: 'info' },
  'Rumah & Taman': { icon: 'tabler-smart-home', color: 'warning' },
  'Olahraga': { icon: 'tabler-ball-football', color: 'error' },
  'Otomotif': { icon: 'tabler-car', color: 'success' },
  'Buku & Media': { icon: 'tabler-book', color: 'info' }
}

const productStatusObj: productStatusType = {
  active: { title: 'Active', color: 'success' },
  inactive: { title: 'Inactive', color: 'error' },
  draft: { title: 'Draft', color: 'warning' }
}

// Column Definitions
const columnHelper = createColumnHelper<ProductWithActionsType>()

const ProductListTable = () => {
  // Next.js hooks for detecting URL parameters
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // RBAC Context
  const { currentStore, user, isLoading: rbacLoading } = useRBAC()

  // States
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [totalRows, setTotalRows] = useState(0)
  // States for smart refresh management
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [isUserActive, setIsUserActive] = useState(true)
  const [hasBeenAway, setHasBeenAway] = useState(false)

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Reduced debouncing for faster response
  const debouncedSearch = useDebounce(globalFilter, 200) // Reduced from 500ms
  const debouncedStatusFilter = useDebounce(statusFilter, 100) // Reduced from 300ms  
  const debouncedCategoryFilter = useDebounce(categoryFilter, 100) // Reduced from 300ms

  // Fetch products from API with smart caching
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    // Check for store UUID - prioritize uuid field over id
    const storeUuid = currentStore?.uuid || currentStore?.id
    if (!storeUuid) {
      console.warn('No current store UUID available for fetching products')
      return
    }

    // Implement aggressive caching - keep data fresh for 5 minutes to avoid loading delays
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTime
    const cacheTimeout = 300000 // 5 minutes - extended for instant loading experience
    
    if (!forceRefresh && timeSinceLastFetch < cacheTimeout && products.length > 0) {
      console.log('Using cached data, last fetch was', Math.round(timeSinceLastFetch / 1000), 'seconds ago')
      return // Return immediately without loading indicator for instant display
    }

    try {
      // Only show loading for fresh requests, not cached data
      if (forceRefresh || products.length === 0) {
        setLoading(true)
      }
      setError(null)

      const filters = {
        search: debouncedSearch || undefined,
        status: debouncedStatusFilter !== 'all' ? debouncedStatusFilter as any : undefined,
        category_id: debouncedCategoryFilter !== 'all' ? Number(debouncedCategoryFilter) : undefined,
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize
      }

      console.log('Fetching products for store UUID:', storeUuid, 'with filters:', filters)

      // Use public endpoint to fetch products
      const queryParams = new URLSearchParams()
      queryParams.append('store_uuid', storeUuid)
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 'all') {
          queryParams.append(key, String(value))
        }
      })

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

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

      // Add cache busting only when forcing refresh, otherwise allow browser caching
      const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : ''
      const cacheControl = forceRefresh ? 'no-cache' : 'default'

      const response = await fetch(`${apiUrl}/public/products?${queryParams.toString()}${cacheBuster}`, {
        credentials: 'include',
        cache: cacheControl as RequestCache,
        headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      console.log('Products fetched successfully:', result)
      if (result.status === 'success') {
        setProducts(result.data.data || [])
        setTotalRows(result.data.total || 0)
        setLastFetchTime(now) // Track successful fetch time
      } else {
        throw new Error(result.message || 'Failed to fetch products')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      console.error('Error fetching products for store UUID:', storeUuid, err)
    } finally {
      setLoading(false)
    }
  }, [currentStore?.uuid, currentStore?.id, debouncedSearch, debouncedStatusFilter, debouncedCategoryFilter, pagination])

  // Fetch categories (cached for session)
  const fetchCategories = useCallback(async () => {
    // Check if categories are already loaded
    if (categories.length > 0) {
      return
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const response = await fetch(`${apiUrl}/public/categories`, {
        credentials: 'include',
        cache: 'default', // Allow browser caching for categories
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })
      if (response.ok) {
        const result = await response.json()
        setCategories(result.data || [])
      } else {
        throw new Error('Failed to fetch categories')
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [categories.length])

  // Initialize data
  useEffect(() => {
    fetchCategories()
  }, [])

  // Fetch products when dependencies change
  useEffect(() => {
    if (currentStore && !rbacLoading) {
      fetchProducts()
    }
  }, [fetchProducts, currentStore, rbacLoading])

  // Check for refresh parameter from successful product edit
  useEffect(() => {
    const refreshParam = searchParams.get('refresh')
    if (refreshParam === 'true' && currentStore && !rbacLoading) {
      console.log('Detected refresh parameter, forcing data refresh after product edit')
      fetchProducts(true) // Force refresh to bypass cache
      
      // Clean up the URL parameter
      const url = new URL(window.location.href)
      url.searchParams.delete('refresh')
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [searchParams, currentStore, rbacLoading, fetchProducts, router])

  // Simplified visibility and focus handling - less aggressive refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsUserActive(false)
        setHasBeenAway(true)
      } else {
        setIsUserActive(true)
        // Only refresh if user has been away for more than 10 minutes
        const timeSinceLastFetch = Date.now() - lastFetchTime
        if (hasBeenAway && timeSinceLastFetch > 600000 && currentStore && !rbacLoading) {
          console.log('User returned after long absence, refreshing products...')
          fetchProducts(false) // Don't force, allow cache
          setHasBeenAway(false)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentStore, rbacLoading, fetchProducts, lastFetchTime, hasBeenAway])

  // Minimal auto refresh - only refresh if user is active and data is very old
  useEffect(() => {
    if (!currentStore || rbacLoading) return

    const interval = setInterval(() => {
      const timeSinceLastFetch = Date.now() - lastFetchTime
      const isDataVeryStale = timeSinceLastFetch > 600000 // 10 minutes (increased from 5)
      
      if (isUserActive && isDataVeryStale) {
        console.log('Background refresh: data is very stale and user is active')
        fetchProducts(false) // Don't force refresh, respect cache
      }
    }, 300000) // Check every 5 minutes instead of 2 minutes

    return () => clearInterval(interval)
  }, [currentStore, rbacLoading, fetchProducts, lastFetchTime, isUserActive])

  // Handle status update
  const handleStatusUpdate = async (product: Product, newStatus: 'active' | 'inactive' | 'draft') => {
    try {
      await productApi.updateProductStatus(product.uuid, newStatus)
      // Force refresh since user made a change
      fetchProducts(true)
    } catch (err) {
      console.error('Error updating product status:', err)
    }
  }

  // Handle product delete
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    try {
      setDeleting(true)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const response = await fetch(`${apiUrl}/public/products/${productToDelete.uuid}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.status === 'success') {
        // Force refresh since user deleted a product
        fetchProducts(true)
        setDeleteDialogOpen(false)
        setProductToDelete(null)
      } else {
        throw new Error(result.message || 'Failed to delete product')
      }
    } catch (err) {
      console.error('Error deleting product:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    fetchProducts(true) // Force refresh ignoring cache
  }, [fetchProducts])

  // Handle Excel export
  const handleExcelExport = () => {
    try {
      // Format data for Excel export
      const exportData = products.map((product, index) => ({
        'No': index + 1,
        'Nama Produk': product.nama_produk,
        'SKU': product.sku,
        'Kategori': product.category?.judul_kategori || '-',
        'Jenis Produk': product.jenis_produk === 'digital' ? 'Digital' : 'Fisik',
        'Harga': product.harga_produk.toLocaleString('id-ID'),
        'Harga Diskon': product.harga_diskon ? product.harga_diskon.toLocaleString('id-ID') : '-',
        'Stock': product.stock,
        'Status': product.status_produk === 'active' ? 'Aktif' : product.status_produk === 'inactive' ? 'Tidak Aktif' : 'Draft',
        'Deskripsi': product.deskripsi || '-',
        'URL Produk': product.url_produk || '-',
        'Meta Description': product.meta_description || '-',
        'Meta Keywords': product.meta_keywords || '-',
        'Dibuat': new Date(product.created_at).toLocaleDateString('id-ID'),
        'Diperbarui': new Date(product.updated_at).toLocaleDateString('id-ID')
      }))

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      const colWidths = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama Produk
        { wch: 15 }, // SKU
        { wch: 20 }, // Kategori
        { wch: 12 }, // Jenis Produk
        { wch: 15 }, // Harga
        { wch: 15 }, // Harga Diskon
        { wch: 8 },  // Stock
        { wch: 12 }, // Status
        { wch: 30 }, // Deskripsi
        { wch: 25 }, // URL Produk
        { wch: 30 }, // Meta Description
        { wch: 30 }, // Meta Keywords
        { wch: 12 }, // Dibuat
        { wch: 12 }  // Diperbarui
      ]
      ws['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Products')

      // Generate filename with current date
      const today = new Date().toISOString().split('T')[0]
      const storeName = currentStore?.nama_toko || currentStore?.name || 'Store'
      const filename = `${storeName}_Products_${today}.xlsx`

      // Save file
      XLSX.writeFile(wb, filename)
    } catch (err) {
      console.error('Error exporting to Excel:', err)
      setError('Failed to export data to Excel')
    }
  }

  // Columns
  const columns = useMemo<ColumnDef<ProductWithActionsType, any>[]>(() => [
    columnHelper.accessor('id', {
      header: 'No',
      cell: ({ row }) => (
        <Typography color="text.primary">
          {pagination.pageIndex * pagination.pageSize + row.index + 1}
        </Typography>
      )
    }),
    columnHelper.accessor('nama_produk', {
      header: 'Produk',
      cell: ({ row }) => {
        // Get product images using utility function
        const images = getProductImages(row.original.upload_gambar_produk)
        const mainImagePath = images.length > 0 ? images[0] : null
        const imageUrl = mainImagePath ? getImageUrl(mainImagePath) : null

        return (
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                width={38}
                height={38}
                className="rounded bg-actionHover object-cover"
                alt={row.original.nama_produk}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  // Show placeholder on error
                  const parent = target.parentElement
                  const placeholder = parent?.querySelector('.product-placeholder')
                  if (placeholder) {
                    (placeholder as HTMLElement).style.display = 'block'
                  }
                }}
              />
            ) : null}
            <ProductPlaceholder
              width={38}
              height={38}
              className={`product-placeholder ${imageUrl ? 'hidden' : ''}`}
            />
            <div className="flex flex-col max-w-[300px]">
              <Typography className="font-medium" color="text.primary" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                {row.original.nama_produk}
              </Typography>
            </div>
          </div>
        )
      }
    }),
    columnHelper.accessor('jenis_produk', {
      header: 'Jenis Produk',
      cell: ({ row }) => {
        const productType = row.original.jenis_produk
        const isDigital = productType === 'digital'
        
        return (
          <div className="flex items-center gap-4">
            <CustomAvatar skin="light" color={isDigital ? 'info' : 'success'} size={30}>
              <i className={classnames(isDigital ? 'tabler-cloud' : 'tabler-package', 'text-lg')} />
            </CustomAvatar>
            <Typography color="text.primary">
              {isDigital ? 'Digital' : 'Fisik'}
            </Typography>
          </div>
        )
      }
    }),
    columnHelper.accessor('category', {
      header: 'Kategori',
      cell: ({ row }) => {
        const categoryName = row.original.category?.judul_kategori || 'Uncategorized'
        const categoryIcon = productCategoryObj[categoryName]?.icon || 'tabler-tag'
        const categoryColor = productCategoryObj[categoryName]?.color || 'secondary'
        
        return (
          <div className="flex items-center gap-4">
            <CustomAvatar skin="light" color={categoryColor} size={30}>
              <i className={classnames(categoryIcon, 'text-lg')} />
            </CustomAvatar>
            <Typography color="text.primary">{categoryName}</Typography>
          </div>
        )
      }
    }),
    columnHelper.accessor('harga_produk', {
      header: 'Harga Awal',
      cell: ({ row }) => (
        <Typography>
          Rp {new Intl.NumberFormat('id-ID').format(row.original.harga_produk)}
        </Typography>
      )
    }),
    columnHelper.accessor('harga_diskon', {
      header: 'Harga Diskon',
      cell: ({ row }) => (
        <Typography>
          {row.original.harga_diskon 
            ? `Rp ${new Intl.NumberFormat('id-ID').format(row.original.harga_diskon)}` 
            : '-'
          }
        </Typography>
      )
    }),
    columnHelper.accessor('status_produk', {
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status_produk
        const statusConfig = productStatusObj[status] || productStatusObj.draft
        
        return (
          <Chip
            variant="tonal"
            size="small"
            color={statusConfig.color}
            label={statusConfig.title}
            className="cursor-pointer"
            onClick={() => {
              // Cycle through statuses: active -> inactive -> draft -> active
              let nextStatus: 'active' | 'inactive' | 'draft'
              if (status === 'active') {
                nextStatus = 'inactive'
              } else if (status === 'inactive') {
                nextStatus = 'draft'
              } else {
                nextStatus = 'active'
              }
              handleStatusUpdate(row.original, nextStatus)
            }}
          />
        )
      },
      enableSorting: false
    }),
    columnHelper.accessor('actions', {
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center">
          <IconButton component={Link} href={`/apps/tokoku/products/edit/${row.original.uuid}`}>
            <i className="tabler-edit text-textSecondary" />
          </IconButton>
          <IconButton onClick={() => handleDeleteClick(row.original)}>
            <i className="tabler-trash text-textSecondary" />
          </IconButton>
        </div>
      ),
      enableSorting: false
    })
  ], [pagination.pageIndex, pagination.pageSize, handleStatusUpdate, handleDeleteClick])

  // Table setup with server-side pagination
  const table = useReactTable({
    data: products,
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
    manualPagination: true, // Enable server-side pagination
    manualFiltering: true,  // Enable server-side filtering
    pageCount: Math.ceil(totalRows / pagination.pageSize)
  })

  // Skeleton loading component
  const renderSkeleton = () => (
    <Card>
      <CardHeader
        title={<Skeleton variant="text" width={150} height={32} />}
        action={
          <div className="flex gap-3">
            <Skeleton variant="rounded" width={120} height={40} />
            <Skeleton variant="rounded" width={140} height={40} />
          </div>
        }
      />
      <Divider />
      <CardContent>
        {/* Filter row skeleton */}
        <div className="flex justify-between items-center mb-4">
          <Skeleton variant="rounded" width={80} height={40} />
          <div className="flex gap-3">
            <Skeleton variant="rounded" width={200} height={40} />
            <Skeleton variant="rounded" width={150} height={40} />
            <Skeleton variant="rounded" width={150} height={40} />
          </div>
        </div>
        {/* Table skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <Skeleton variant="rectangular" width={40} height={20} />
              <Skeleton variant="rectangular" width={60} height={60} />
              <Skeleton variant="text" width={200} />
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={80} />
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="circular" width={32} height={32} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // Show loading or error states
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
      {/* Header: title kiri, tombol kanan */}
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Typography variant="h5">My Products</Typography>
            {loading && products.length > 0 && (
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
            <Button 
              color="success" 
              variant="tonal" 
              startIcon={<i className="tabler-file-excel" />}
              onClick={handleExcelExport}
              disabled={products.length === 0 || loading}
            >
              Export
            </Button>
            <Button variant="contained" component={Link} href="/apps/tokoku/products/add" startIcon={<i className="tabler-plus" />}>
              Add Product
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
          {/* Kiri bawah: Show entries */}
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

          {/* Kanan bawah: Search + Filter */}
          <div className="flex gap-3 items-center">
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={val => setGlobalFilter(String(val))}
              placeholder="Search Product"
              className="w-[200px]"
            />

            <CustomTextField select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-[150px]">
              <MenuItem value="all">All Status</MenuItem>
              {Object.entries(productStatusObj).map(([key, status]) => (
                <MenuItem key={key} value={key}>{status.title}</MenuItem>
              ))}
            </CustomTextField>

            <CustomTextField select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-[150px]">
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category.id} value={category.id}>{category.judul_kategori}</MenuItem>
              ))}
            </CustomTextField>
          </div>
        </div>

        {/* Table */}
        {loading && products.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton variant="rectangular" width={40} height={20} />
                <Skeleton variant="rectangular" width={60} height={60} />
                <Skeleton variant="text" width={200} />
                <Skeleton variant="text" width={120} />
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={80} />
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
            {products.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                    {loading ? 'Loading...' : 'No products found'}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <i className="tabler-alert-triangle text-warning text-xl" />
            Konfirmasi Hapus
          </div>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus produk <strong>{productToDelete?.nama_produk}</strong>?
            <br />
            Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="p-4 pt-0">
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={deleting}
            variant="outlined"
          >
            Batal
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <i className="tabler-loader animate-spin" /> : <i className="tabler-trash" />}
          >
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default ProductListTable