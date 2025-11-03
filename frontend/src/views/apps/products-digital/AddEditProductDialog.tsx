'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { ProductDigital } from './ProductDigitalCard'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  product?: ProductDigital | null
  categories: string[]
}

const AddEditProductDialog = ({ open, onClose, onSuccess, product, categories }: Props) => {
  // States
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    nama_produk: '',
    kategori: '',
    deskripsi: '',
    link_preview: '',
    link_download: '',
    is_active: true
  })

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (open) {
      if (product) {
        setFormData({
          nama_produk: product.nama_produk,
          kategori: product.kategori,
          deskripsi: product.deskripsi,
          link_preview: product.link_preview || '',
          link_download: product.link_download || '',
          is_active: product.is_active
        })
        setImagePreview(product.gambar || null)
        setImageFile(null)
      } else {
        setFormData({
          nama_produk: '',
          kategori: '',
          deskripsi: '',
          link_preview: '',
          link_download: '',
          is_active: true
        })
        setImagePreview(null)
        setImageFile(null)
      }
    }
  }, [open, product])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      setImageFile(file)

      // Create preview
      const reader = new FileReader()

      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }

      reader.readAsDataURL(file)
    }
  }

  const addHttpPrefix = (url: string): string => {
    if (!url) return url
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return 'https://' + url
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const formDataToSend = new FormData()

      // Auto-prefix http/https to links
      const previewLink = formData.link_preview ? addHttpPrefix(formData.link_preview) : ''
      const downloadLink = formData.link_download ? addHttpPrefix(formData.link_download) : ''

      formDataToSend.append('nama_produk', formData.nama_produk)
      formDataToSend.append('kategori', formData.kategori)
      formDataToSend.append('deskripsi', formData.deskripsi)
      formDataToSend.append('link_preview', previewLink)
      formDataToSend.append('link_download', downloadLink)
      formDataToSend.append('is_active', formData.is_active ? '1' : '0')

      if (imageFile) {
        formDataToSend.append('gambar', imageFile)
      }

      const url = product
        ? `${process.env.NEXT_PUBLIC_API_URL}/public/products-digital/${product.uuid}`
        : `${process.env.NEXT_PUBLIC_API_URL}/public/products-digital`

      const method = product ? 'POST' : 'POST'

      if (product) {
        formDataToSend.append('_method', 'PUT')
      }

      const response = await fetch(url, {
        method: method,
        body: formDataToSend
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        alert('Error: ' + (result.message || 'Something went wrong'))
      }
    } catch (error) {
      console.error('Error submitting product:', error)
      alert('Error submitting product')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <div className='flex items-center justify-between'>
          <Typography variant='h5'>{product ? 'Edit Product Digital' : 'Add Product Digital'}</Typography>
          <IconButton onClick={onClose} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={4} className='pbs-4'>
          {/* Image Upload */}
          <Grid size={12}>
            <div className='flex flex-col items-center gap-4'>
              <Avatar
                src={imagePreview || '/images/pages/product-placeholder.png'}
                variant='rounded'
                sx={{ width: 200, height: 200 }}
              />
              <Button variant='outlined' component='label'>
                Upload Image
                <input type='file' hidden accept='image/*' onChange={handleImageChange} />
              </Button>
            </div>
          </Grid>

          {/* Product Name */}
          <Grid size={12}>
            <TextField
              fullWidth
              label='Product Name'
              value={formData.nama_produk}
              onChange={e => handleChange('nama_produk', e.target.value)}
              required
            />
          </Grid>

          {/* Category */}
          <Grid size={12}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.kategori}
                onChange={e => handleChange('kategori', e.target.value)}
                label='Category'
              >
                <MenuItem value='Productivity'>Productivity</MenuItem>
                <MenuItem value='Planner'>Planner</MenuItem>
                <MenuItem value='Financial'>Financial</MenuItem>
                <MenuItem value='Book'>Book</MenuItem>
                <MenuItem value='Pengembangan Anak'>Pengembangan Anak</MenuItem>
                <MenuItem value='Template'>Template</MenuItem>
                <MenuItem value='UI/UX'>UI/UX</MenuItem>
                <MenuItem value='Design'>Design</MenuItem>
                <MenuItem value='Education'>Education</MenuItem>
                <MenuItem value='Business'>Business</MenuItem>
                <MenuItem value='Marketing'>Marketing</MenuItem>
                <MenuItem value='Other'>Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Description */}
          <Grid size={12}>
            <TextField
              fullWidth
              label='Description'
              value={formData.deskripsi}
              onChange={e => handleChange('deskripsi', e.target.value)}
              multiline
              rows={4}
            />
          </Grid>

          {/* Preview Link */}
          <Grid size={12}>
            <TextField
              fullWidth
              label='Preview Link'
              value={formData.link_preview}
              onChange={e => handleChange('link_preview', e.target.value)}
              placeholder='https://...'
            />
          </Grid>

          {/* Download Link */}
          <Grid size={12}>
            <TextField
              fullWidth
              label='Download Link'
              value={formData.link_download}
              onChange={e => handleChange('link_download', e.target.value)}
              placeholder='https://...'
            />
          </Grid>

          {/* Status */}
          <Grid size={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={e => handleChange('is_active', e.target.value === 'active')}
                label='Status'
              >
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary' disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={loading || !formData.nama_produk || !formData.kategori}
        >
          {loading ? <CircularProgress size={20} /> : product ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddEditProductDialog
