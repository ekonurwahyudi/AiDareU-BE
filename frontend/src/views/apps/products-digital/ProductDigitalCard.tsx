// React Imports
import type { ChangeEvent } from 'react'
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import DirectionalIcon from '@components/DirectionalIcon'
import AddEditProductDialog from './AddEditProductDialog'

export type ProductDigital = {
  id: number
  uuid: string
  nama_produk: string
  kategori: string
  deskripsi: string
  link_preview?: string
  link_download?: string
  gambar?: string
  is_active: boolean
}

type ChipColorType = {
  color: ThemeColor
}

type Props = {
  productData?: ProductDigital[]
  searchValue: string
}

const chipColor: { [key: string]: ChipColorType } = {
  'Productivity': { color: 'primary' },
  'Planner': { color: 'info' },
  'Financial': { color: 'success' },
  'Book': { color: 'secondary' },
  'Pengembangan Anak': { color: 'error' },
  'Template': { color: 'warning' },
  'UI/UX': { color: 'primary' },
  'Design': { color: 'info' },
  'Education': { color: 'success' },
  'Business': { color: 'error' },
  'Marketing': { color: 'warning' },
  'Other': { color: 'secondary' }
}

const ProductDigitalCard = (props: Props) => {
  // Props
  const { productData, searchValue } = props

  // Hooks
  const router = useRouter()
  const { hasRole } = useRBAC()

  // States
  const [category, setCategory] = useState<string>('All')
  const [data, setData] = useState<ProductDigital[]>([])
  const [activePage, setActivePage] = useState(0)
  const [categories, setCategories] = useState<string[]>(['All'])
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductDigital | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuProduct, setMenuProduct] = useState<ProductDigital | null>(null)

  useEffect(() => {
    // Get unique categories from product data
    if (productData) {
      const uniqueCategories = ['All', ...new Set(productData.map(item => item.kategori))]
      setCategories(uniqueCategories)
    }
  }, [productData])

  useEffect(() => {
    let newData =
      productData?.filter(productItem => {
        if (category === 'All') return productItem.is_active

        return productItem.kategori === category && productItem.is_active
      }) ?? []

    if (searchValue) {
      newData = newData.filter(product =>
        product.nama_produk.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.deskripsi.toLowerCase().includes(searchValue.toLowerCase())
      )
    }

    if (activePage > Math.ceil(newData.length / 6)) setActivePage(0)

    setData(newData)
  }, [searchValue, activePage, category, productData])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: ProductDigital) => {
    setAnchorEl(event.currentTarget)
    setMenuProduct(product)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuProduct(null)
  }

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setOpenDialog(true)
  }

  const handleEditProduct = (product: ProductDigital) => {
    setSelectedProduct(product)
    setOpenDialog(true)
    handleMenuClose()
  }

  const handleDeleteClick = (product: ProductDigital) => {
    setSelectedProduct(product)
    setOpenDeleteDialog(true)
    handleMenuClose()
  }

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/products-digital/${selectedProduct.uuid}`,
        {
          method: 'DELETE'
        }
      )

      const result = await response.json()

      if (result.success) {
        setOpenDeleteDialog(false)
        setSelectedProduct(null)
        router.refresh()
      } else {
        alert('Error deleting product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <Typography variant='h5'>Product Digital</Typography>
            <Typography>Total {data.length} products available</Typography>
          </div>
          <div className='flex flex-wrap items-center gap-y-4 gap-x-4'>
            <FormControl fullWidth size='small' className='is-[250px] flex-auto'>
              <Select
                fullWidth
                id='select-category'
                value={category}
                onChange={e => {
                  setCategory(e.target.value)
                  setActivePage(0)
                }}
                labelId='category-select'
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {hasRole('superadmin') && (<Button
              variant='contained'
              color='primary'
              startIcon={<i className='tabler-plus' />}
              onClick={handleAddProduct}
            >
              Add Product
            </Button>)}
          </div>
        </div>
        {data.length > 0 ? (
          <Grid container spacing={6}>
            {data.slice(activePage * 6, activePage * 6 + 6).map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <div className='border rounded bs-full'>
                  <div className='pli-2 pbs-2 relative'>
                    <div className='flex'>
                      <img
                        src={item.gambar || '/images/pages/product-placeholder.png'}
                        alt={item.nama_produk}
                        className='is-full object-cover'
                        style={{ height: '200px' }}
                      />
                    </div>
                    <IconButton
                      size='small'
                      className='absolute top-2 right-2 bg-white'
                      onClick={(e) => handleMenuOpen(e, item)}
                    >
                      <i className='tabler-dots-vertical' />
                    </IconButton>
                  </div>
                  <div className='flex flex-col gap-4 p-5'>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2'>
                        <Chip
                          label={item.kategori}
                          variant='tonal'
                          size='small'
                          color={chipColor[item.kategori]?.color || 'primary'}
                        />
                        <Chip
                          label='GRATIS'
                          variant='tonal'
                          size='small'
                          color='warning'
                          sx={{ fontWeight: 600 }}
                        />
                      </div>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <Typography
                        variant='h5'
                        className='hover:text-primary'
                      >
                        {item.nama_produk}
                      </Typography>
                      <Typography className='line-clamp-2'>
                        {item.deskripsi}
                      </Typography>
                    </div>
                    <div className='flex flex-wrap gap-4'>
                      {item.link_preview && (
                        <Button
                          fullWidth
                          variant='tonal'
                          color='secondary'
                          startIcon={<i className='tabler-eye' />}
                          component={Link}
                          href={item.link_preview}
                          target='_blank'
                          className='is-auto flex-auto'
                        >
                          Preview
                        </Button>
                      )}
                      {item.link_download && (
                        <Button
                          fullWidth
                          variant='tonal'
                          endIcon={
                            <DirectionalIcon ltrIconClass='tabler-download' rtlIconClass='tabler-download' />
                          }
                          component={Link}
                          href={item.link_download}
                          target='_blank'
                          className='is-auto flex-auto'
                        >
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography className='text-center'>No products found</Typography>
        )}
        <div className='flex justify-center'>
          <Pagination
            count={Math.ceil(data.length / 6)}
            page={activePage + 1}
            showFirstButton
            showLastButton
            shape='rounded'
            variant='tonal'
            color='primary'
            onChange={(e, page) => setActivePage(page - 1)}
          />
        </div>
      </CardContent>

      {/* Menu for Edit/Delete */}
     <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => menuProduct && handleEditProduct(menuProduct)}>
          <i className='tabler-edit mie-2' />
          Edit
        </MenuItem>
        <MenuItem onClick={() => menuProduct && handleDeleteClick(menuProduct)}>
          <i className='tabler-trash mie-2' />
          Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <AddEditProductDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSuccess={handleSuccess}
        product={selectedProduct}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedProduct?.nama_produk}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color='secondary'>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default ProductDigitalCard
