'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

interface SocialMediaStepProps {
  handlePrev: () => void
  onComplete: () => void
  storeData: any
  setStoreData: (data: any) => void
}

// Validation Schema
const schema = yup.object().shape({
  instagram: yup.string().test('url', 'URL Instagram tidak valid', function(value) {
    if (!value || value === '') return true // Allow empty
    return yup.string().url().isValidSync(value)
  }),
  facebook: yup.string().test('url', 'URL Facebook tidak valid', function(value) {
    if (!value || value === '') return true // Allow empty
    return yup.string().url().isValidSync(value)
  }),
  tiktok: yup.string().test('url', 'URL TikTok tidak valid', function(value) {
    if (!value || value === '') return true // Allow empty
    return yup.string().url().isValidSync(value)
  }),
  youtube: yup.string().test('url', 'URL YouTube tidak valid', function(value) {
    if (!value || value === '') return true // Allow empty
    return yup.string().url().isValidSync(value)
  })
})

const SocialMediaStep = ({ handlePrev, onComplete, storeData, setStoreData }: SocialMediaStepProps) => {
  // States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      instagram: storeData.instagram || '',
      facebook: storeData.facebook || '',
      tiktok: storeData.tiktok || '',
      youtube: storeData.youtube || ''
    }
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Update store data
      const finalData = {
        ...storeData,
        instagram: data.instagram,
        facebook: data.facebook,
        tiktok: data.tiktok,
        youtube: data.youtube
      }
      
      setStoreData(finalData)

      // Submit to backend
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      
      // Ensure subdomain field is correctly named
      const dataToSubmit = {
        ...finalData,
        subdomain: finalData.subdomain // Make sure this matches the backend validation field
      }
      
      console.log('Submitting store data:', dataToSubmit)
      
      const response = await fetch(`${backendUrl}/api/store/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : ''
        },
        body: JSON.stringify(dataToSubmit)
      })

      const result = await response.json()

      if (response.ok) {
        // Update user data in localStorage to mark store as setup
        const userData = localStorage.getItem('user_data')
        if (userData) {
          const user = JSON.parse(userData)
          user.has_store = true
          user.store_id = result.store?.id
          localStorage.setItem('user_data', JSON.stringify(user))
        }
        
        onComplete()
      } else {
        setError(result.message || 'Terjadi kesalahan saat menyimpan data toko')
      }
    } catch (error) {
      console.error('Store setup error:', error)
      setError('Terjadi kesalahan saat menyimpan data toko. Silakan coba lagi atau hubungi administrator.')
    }

    setIsSubmitting(false)
  }

  return (
    <Box>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6}>
          <Controller
            name='instagram'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Instagram'
                placeholder='https://instagram.com/username'
                error={!!errors.instagram}
                helperText={errors.instagram?.message || ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-brand-instagram" style={{ color: '#E1306C' }} />
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name='facebook'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Facebook'
                placeholder='https://facebook.com/username'
                error={!!errors.facebook}
                helperText={errors.facebook?.message || ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-brand-facebook" style={{ color: '#1877F2' }} />
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name='tiktok'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='TikTok'
                placeholder='https://tiktok.com/@username'
                error={!!errors.tiktok}
                helperText={errors.tiktok?.message || ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-brand-tiktok" style={{ color: '#000000' }} />
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name='youtube'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='YouTube'
                placeholder='https://youtube.com/@username'
                error={!!errors.youtube}
                helperText={errors.youtube?.message || ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-brand-youtube" style={{ color: '#FF0000' }} />
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
        </Grid>
      </Grid>

        <Box className='flex justify-between mt-8'>
          <Button
            variant='outlined'
            onClick={handlePrev}
            disabled={isSubmitting}
            startIcon={<i className='tabler-arrow-left' />}
          >
            Sebelumnya
          </Button>
          <Button
            variant='contained'
            type='submit'
            disabled={isSubmitting}
            endIcon={isSubmitting ? <CircularProgress size={16} /> : <i className='tabler-check' />}
          >
            {isSubmitting ? 'Menyimpan...' : 'Selesai'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default SocialMediaStep