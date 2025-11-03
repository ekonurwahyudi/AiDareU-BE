'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import FormHelperText from '@mui/material/FormHelperText'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

interface StoreInfoStepProps {
  handleNext: () => void
  storeData: any
  setStoreData: (data: any) => void
}

// Validation Schema
const schema = yup.object().shape({
  storeName: yup.string().required('Nama toko wajib diisi').min(3, 'Nama toko minimal 3 karakter'),
  subdomain: yup
    .string()
    .required('Subdomain wajib diisi')
    .min(3, 'Subdomain minimal 3 karakter')
    .matches(/^[a-z0-9-]+$/, 'Subdomain hanya boleh berisi huruf kecil, angka, dan tanda -'),
  phoneNumber: yup.string().required('Nomor HP wajib diisi').min(10, 'Nomor HP minimal 10 digit'),
  category: yup.string().required('Kategori toko wajib dipilih'),
  description: yup.string().required('Deskripsi toko wajib diisi').min(10, 'Deskripsi minimal 10 karakter')
})

const categories = [
  'Produk Digital',
  'Fashion & Pakaian',
  'Elektronik & Gadget', 
  'Makanan & Minuman',
  'Kesehatan & Kecantikan',
  'Rumah & Taman',
  'Olahraga & Outdoor',
  'Buku & Alat Tulis',
  'Mainan & Bayi',
  'Otomotif',
  'Lainnya'
]

const StoreInfoStep = ({ handleNext, storeData, setStoreData }: StoreInfoStepProps) => {
  // States
  const [subdomainChecking, setSubdomainChecking] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null)

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      storeName: storeData.storeName || '',
      subdomain: storeData.subdomain || '',
      phoneNumber: storeData.phoneNumber || '',
      category: storeData.category || '',
      description: storeData.description || ''
    }
  })

  const watchedSubdomain = watch('subdomain')

  // Check subdomain availability
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null)
      return
    }

    setSubdomainChecking(true)
    
    try {
      console.log('Checking subdomain (Next API):', subdomain, 'at URL:', `/api/stores/check-subdomain?subdomain=${subdomain}`)

      const response = await fetch(`/api/stores/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        setSubdomainAvailable(data.available)
      } else {
        console.error('Subdomain check error:', data)
        setSubdomainAvailable(null)
      }
    } catch (error) {
      console.error('Error checking subdomain:', error)
      setSubdomainAvailable(null)
    }
    
    setSubdomainChecking(false)
  }

  // Debounced subdomain check
  useEffect(() => {
    if (checkTimeout) {
      clearTimeout(checkTimeout)
    }

    if (watchedSubdomain) {
      const timeout = setTimeout(() => {
        checkSubdomainAvailability(watchedSubdomain)
      }, 800) // Wait 800ms after user stops typing
      
      setCheckTimeout(timeout)
    } else {
      setSubdomainAvailable(null)
    }

    return () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout)
      }
    }
  }, [watchedSubdomain])

  // Generate subdomain from store name
  const generateSubdomain = (storeName: string) => {
    return storeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  const onSubmit = (data: any) => {
    // Update store data
    setStoreData({
      ...storeData,
      storeName: data.storeName,
      subdomain: data.subdomain,
      phoneNumber: data.phoneNumber,
      category: data.category,
      description: data.description
    })
    
    handleNext()
  }

  return (
    <Box>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
          <Controller
            name='storeName'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Nama Toko'
                placeholder='Masukkan nama toko Anda'
                error={!!errors.storeName}
                helperText={
                  typeof errors.storeName?.message === 'string'
                    ? errors.storeName?.message
                    : ''
                }
                onChange={(e) => {
                  field.onChange(e)
                  // Auto-generate subdomain
                  const generated = generateSubdomain(e.target.value)
                  setValue('subdomain', generated)
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name='subdomain'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Sub Domain'
                placeholder='namatoko'
                error={!!errors.subdomain || subdomainAvailable === false}
                helperText={
                  (typeof errors.subdomain?.message === 'string' ? errors.subdomain?.message : undefined) ??
                  (subdomainAvailable === false
                    ? 'Subdomain sudah digunakan'
                    : subdomainAvailable === true
                    ? 'Subdomain tersedia'
                    : subdomainChecking
                    ? 'Mengecek ketersediaan...'
                    : '')
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">https://</InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      {subdomainChecking ? (
                        <CircularProgress size={20} />
                      ) : subdomainAvailable === true ? (
                        <i className="tabler-check text-success" />
                      ) : subdomainAvailable === false ? (
                        <i className="tabler-x text-error" />
                      ) : null}
                      <span className="ml-2">.aidareu.com</span>
                    </InputAdornment>
                  )
                }}
                FormHelperTextProps={{
                  sx: {
                    color: subdomainAvailable === true ? 'success.main' : 
                           subdomainAvailable === false ? 'error.main' : 'text.secondary'
                  }
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name='phoneNumber'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='No. HP Toko'
                placeholder='08123456789'
                error={!!errors.phoneNumber}
                helperText={
                  typeof errors.phoneNumber?.message === 'string'
                    ? errors.phoneNumber?.message
                    : ''
                }
                 InputProps={{
                   startAdornment: <InputAdornment position="start">+62</InputAdornment>
                 }}
               />
             )}
           />
         </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name='category'
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel>Kategori Toko</InputLabel>
                <Select {...field} label='Kategori Toko'>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <FormHelperText>
                    {typeof errors.category?.message === 'string' ? errors.category?.message : ''}
                  </FormHelperText>
                )}
               </FormControl>
             )}
           />
         </Grid>

        <Grid item xs={12}>
          <Controller
            name='description'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={4}
                label='Deskripsi Toko'
                placeholder='Deskripsikan toko Anda, produk yang dijual, dan keunggulan yang ditawarkan...'
                error={!!errors.description}
                helperText={
                  typeof errors.description?.message === 'string'
                    ? errors.description?.message
                    : ''
                }
               />
             )}
           />
         </Grid>
        </Grid>

        <Box className='flex justify-end mt-8'>
          <Button
            variant='contained'
            type='submit'
            disabled={subdomainAvailable === false || subdomainChecking}
            endIcon={<i className='tabler-arrow-right' />}
          >
            Selanjutnya
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default StoreInfoStep