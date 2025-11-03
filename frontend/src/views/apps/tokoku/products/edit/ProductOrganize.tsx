'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import FormHelperText from '@mui/material/FormHelperText'
import CircularProgress from '@mui/material/CircularProgress'

// Context Imports
import { useProductForm } from '@/contexts/ProductFormContext'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

interface Category {
  id: number
  uuid: string
  judul_kategori: string
}

const ProductOrganize = () => {
  const { formData, setFormData, errors } = useProductForm()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const response = await fetch('/api/public/categories', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const result = await response.json()
          setCategories(result.data || [])
        } else {
          console.error('Failed to fetch categories')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ category_id: parseInt(e.target.value) || '' })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ status_produk: e.target.value as 'active' | 'inactive' | 'draft' })
  }

  return (
    <Card>
      <CardHeader title='Setting Produk' />
      <CardContent>
        <form onSubmit={e => e.preventDefault()} className='flex flex-col gap-6'>
          <div>
            <CustomTextField
              select
              fullWidth
              label='Kategori'
              value={formData.category_id}
              onChange={handleCategoryChange}
              error={!!errors.category_id}
              disabled={loadingCategories}
            >
              <MenuItem value="">-- Pilih Kategori --</MenuItem>
              {loadingCategories ? (
                <MenuItem disabled>
                  <CircularProgress size={16} className="mr-2" />
                  Loading...
                </MenuItem>
              ) : (
                categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.judul_kategori}
                  </MenuItem>
                ))
              )}
            </CustomTextField>
            {errors.category_id && (
              <FormHelperText error>{errors.category_id}</FormHelperText>
            )}
          </div>

          <div>
            <CustomTextField 
              select 
              fullWidth 
              label='Status Produk' 
              value={formData.status_produk} 
              onChange={handleStatusChange}
            >
              <MenuItem value='draft'>Draft</MenuItem>
              <MenuItem value='active'>Aktif</MenuItem>
              <MenuItem value='inactive'>Tidak Aktif</MenuItem>
            </CustomTextField>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default ProductOrganize
