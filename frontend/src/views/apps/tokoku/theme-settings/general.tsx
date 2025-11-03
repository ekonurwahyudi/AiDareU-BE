'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import { HexColorPicker } from 'react-colorful'

// Component Imports
import { toast } from 'react-hot-toast'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

const ImgStyled = styled('img')(({ theme }) => ({
  width: 100,
  height: 100,
  marginInlineEnd: theme.spacing(6),
  borderRadius: theme.shape.borderRadius,
  objectFit: 'cover'
}))

const ButtonStyled = styled(Button)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    textAlign: 'center'
  }
}))

const General = () => {
  // RBAC Context - same as Products
  const { currentStore, isLoading: rbacLoading } = useRBAC()

  const [formData, setFormData] = useState({
    site_title: '',
    site_tagline: '',
    primary_color: '#E91E63'
  })
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [favicon, setFavicon] = useState<File | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [tempColor, setTempColor] = useState('#E91E63')

  // Default primary color
  const DEFAULT_PRIMARY_COLOR = '#E91E63'

  // Get store UUID from RBAC Context - same as Products
  const storeUuid = currentStore?.uuid || currentStore?.id
  const storeName = currentStore?.nama_toko || currentStore?.name || ''

  useEffect(() => {
    console.log('RBAC Loading:', rbacLoading)
    console.log('Current Store from RBAC:', currentStore)
    console.log('Store UUID:', storeUuid)
    console.log('Store Name:', storeName)

    if (storeUuid) {
      fetchSettings(storeUuid)
    } else {
      console.warn('No store UUID available from RBAC context')
    }
  }, [storeUuid, rbacLoading])

  const fetchSettings = async (uuid: string) => {
    try {
      // Add cache busting parameter to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`http://localhost:8000/api/theme-settings?store_uuid=${uuid}&_t=${timestamp}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      console.log('Fetched settings data:', data)

      if (data.success && data.data.settings) {
        const settings = data.data.settings
        console.log('Settings object:', settings)

        setFormData({
          site_title: settings.site_title || '',
          site_tagline: settings.site_tagline || '',
          primary_color: settings.primary_color || '#E91E63'
        })

        if (settings.logo) {
          setLogoPreview(`http://localhost:8000/storage/${settings.logo}`)
        }
        if (settings.favicon) {
          setFaviconPreview(`http://localhost:8000/storage/${settings.favicon}`)
        }
      } else {
        console.log('No settings found or request failed')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteLogo = async () => {
    if (!storeUuid) {
      toast.error('Store UUID not found')
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('uuid_store', storeUuid)
      formDataToSend.append('delete_logo', 'true')

      const authToken = localStorage.getItem('auth_token')

      const response = await fetch('http://localhost:8000/api/theme-settings/general', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast.success('Logo deleted successfully')
        setLogo(null)
        setLogoPreview('')
        fetchSettings(storeUuid)
      } else {
        toast.error(data.message || 'Failed to delete logo')
      }
    } catch (error) {
      console.error('Error deleting logo:', error)
      toast.error('An error occurred while deleting logo')
    }
  }

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFavicon(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!storeUuid) {
      toast.error('Store UUID not found')
      return
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('uuid_store', storeUuid)
      formDataToSend.append('site_title', formData.site_title)
      formDataToSend.append('site_tagline', formData.site_tagline)
      formDataToSend.append('primary_color', formData.primary_color)

      if (logo) {
        formDataToSend.append('logo', logo)
      }
      if (favicon) {
        formDataToSend.append('favicon', favicon)
      }

      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token')

      const response = await fetch('http://localhost:8000/api/theme-settings/general', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast.success('General settings updated successfully')
        fetchSettings(storeUuid)
      } else {
        toast.error(data.message || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('An error occurred while updating settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant='h5' sx={{ mb: 4, fontWeight: 600 }}>
        General Settings
      </Typography>
      <Box>
        <Grid container spacing={6}>
                    {/* Site Title */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Site Title'
              placeholder={storeName || 'AiDareU'}
              value={formData.site_title}
              onChange={(e) => handleInputChange('site_title', e.target.value)}
              helperText={storeName ? `Your store name: ${storeName}` : ''}
            />
          </Grid>

          {/* Site Tagline */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Site Tag line'
              placeholder="Where Creativity Meets Innovation"
              value={formData.site_tagline}
              onChange={(e) => handleInputChange('site_tagline', e.target.value)}
            />
          </Grid>
          
          {/* Logo Upload */}
          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='mbe-2'>
              Logo Toko (Optional)
            </Typography>
            <Typography variant='caption' color='text.secondary' className='mbe-4'>
              Upload image size 180x50px recommended
            </Typography>
            <Box className='flex items-center gap-4 mbs-4'>
              {logoPreview ? (
                <ImgStyled src={logoPreview} alt='Logo' />
              ) : (
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className='tabler-photo' style={{ fontSize: '2rem', opacity: 0.5 }} />
                </Box>
              )}
              <div className='flex flex-col gap-4'>
                <div className='flex gap-2'>
                  <Button
                    variant='contained'
                    component='label'
                    htmlFor='logo-upload'
                  >
                    Upload Logo
                    <input
                      hidden
                      type='file'
                      id='logo-upload'
                      accept='image/png, image/jpeg, image/jpg, image/gif'
                      onChange={handleLogoChange}
                    />
                  </Button>
                  {logoPreview && (
                    <Button
                      variant='outlined'
                      color='error'
                      onClick={handleDeleteLogo}
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <Typography variant='caption' color='text.secondary'>
                  Allowed PNG, JPG or GIF. Max size of 2MB
                </Typography>
              </div>
            </Box>
          </Grid>

          {/* Favicon Upload */}
          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='mbe-2'>
              Favicon Icon
            </Typography>
            <Typography variant='caption' color='text.secondary' className='mbe-4'>
              Upload image size 16x16px recommended
            </Typography>
            <Box className='flex items-center gap-4 mbs-4'>
              {faviconPreview ? (
                <ImgStyled src={faviconPreview} alt='Favicon' />
              ) : (
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className='tabler-photo' style={{ fontSize: '2rem', opacity: 0.5 }} />
                </Box>
              )}
              <div className='flex flex-col gap-4'>
                <Button
                  variant='contained'
                  component='label'
                  htmlFor='favicon-upload'
                >
                  Upload Favicon
                  <input
                    hidden
                    type='file'
                    id='favicon-upload'
                    accept='image/png, image/jpeg, image/jpg, image/gif, image/x-icon'
                    onChange={handleFaviconChange}
                  />
                </Button>
                <Typography variant='caption' color='text.secondary'>
                  Allowed PNG, JPG, GIF or ICO. Max size of 512KB
                </Typography>
              </div>
            </Box>
          </Grid>

          {/* Primary Color */}
          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='mbe-2' sx={{ fontWeight: 500 }}>
              Primary Color
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                onClick={() => {
                  setTempColor(formData.primary_color)
                  setColorPickerOpen(true)
                }}
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '12px',
                  bgcolor: formData.primary_color,
                  border: '2px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <i className='tabler-pencil' style={{ fontSize: '2rem', color: 'white', opacity: 0.9 }} />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', gap: 2, alignItems: 'start', flexDirection: 'column' }}>
                <TextField
                  fullWidth
                  label='HEX Color'
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  placeholder='#E91E63'
                  inputProps={{
                    style: { fontFamily: 'monospace', fontSize: '1rem' }
                  }}
                />
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<i className='tabler-refresh' />}
                  onClick={() => handleInputChange('primary_color', DEFAULT_PRIMARY_COLOR)}
                  disabled={formData.primary_color === DEFAULT_PRIMARY_COLOR}
                >
                  Reset to Default
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Color Picker Dialog */}
          <Dialog
            open={colorPickerOpen}
            onClose={() => setColorPickerOpen(false)}
            maxWidth='xs'
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }
            }}
          >
            <DialogTitle sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Choose Color
                </Typography>
                <IconButton onClick={() => setColorPickerOpen(false)} size='small'>
                  <i className='tabler-x' />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Box
                sx={{
                  '& .react-colorful': {
                    width: '100%',
                    height: 250
                  },
                  '& .react-colorful__saturation': {
                    borderRadius: '12px 12px 0 0'
                  },
                  '& .react-colorful__hue': {
                    height: 24,
                    borderRadius: '0 0 12px 12px'
                  },
                  '& .react-colorful__pointer': {
                    width: 24,
                    height: 24
                  }
                }}
              >
                <HexColorPicker color={tempColor} onChange={setTempColor} />
              </Box>
              <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    bgcolor: tempColor,
                    border: '2px solid',
                    borderColor: 'divider'
                  }}
                />
                <TextField
                  fullWidth
                  label='HEX'
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  inputProps={{
                    style: { fontFamily: 'monospace', fontSize: '1.1rem', textTransform: 'uppercase' }
                  }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button onClick={() => setColorPickerOpen(false)} variant='outlined' color='secondary'>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleInputChange('primary_color', tempColor)
                  setColorPickerOpen(false)
                }}
                variant='contained'
              >
                Apply Color
              </Button>
            </DialogActions>
          </Dialog>

          {/* Submit Button */}
          <Grid size={{ xs: 12 }}>
            <div className='flex justify-end gap-4'>
              <Button variant='tonal' color='secondary' onClick={() => storeUuid && fetchSettings(storeUuid)}>
                Reset
              </Button>
              <Button variant='contained' onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default General
