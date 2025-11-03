'use client'

// React Imports
import { useState, useEffect } from 'react'
import { IconButton, InputAdornment, CircularProgress, Autocomplete } from '@mui/material'
import { toast } from 'react-toastify'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

// Component Imports
import DialogCloseButton from '../DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'

type EditUserInfoData = {
  name?: string
  fullName?: string
  nama_lengkap?: string
  no_hp?: string
  email?: string
  status?: string
  role?: string
  contact?: string
  location?: string
  address?: string
  password?: string
  confirmPassword?: string
  bergabung?: string
  created_at?: string
  is_active?: boolean
  roles?: string[]
  uuid?: string
}

type LocationOption = {
  code: string
  name: string
}

type ProvinceOption = {
  code: string
  name: string
}

type EditUserInfoProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: EditUserInfoData
  onSuccess?: () => void
}

const initialData: EditUserInfoProps['data'] = {
  nama_lengkap: '',
  no_hp: '', 
  email: '',
  location: '',
  address: '',
  password: '',
  confirmPassword: ''
}

const EditUserInfo = ({ open, setOpen, data, onSuccess }: EditUserInfoProps) => {
  // States
  const [userData, setUserData] = useState<EditUserInfoProps['data']>(data || initialData)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationInputValue, setLocationInputValue] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<ProvinceOption | null>(null)

  const handleClose = () => {
    setOpen(false)
    setUserData(data || initialData)
  }

  // Fetch provinces on component mount
  const fetchProvinces = async () => {
    try {
      const response = await fetch('/api/locations/provinces', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setProvinces(result.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching provinces:', error)
    }
  }

  // Fetch cities/regencies from API based on province
  const fetchLocations = async (search: string = '', provinceCode?: string) => {
    if (!search.trim() && !provinceCode) {
      setLocations([])
      return
    }
    
    setLocationLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.append('search', search)
      if (provinceCode) params.append('province_code', provinceCode)
      params.append('limit', '50')
      
      const response = await fetch(`/api/locations/cities?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setLocations(result.data || [])
      } else {
        console.error('API Error:', result.message)
        setLocations([])
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      setLocations([])
    } finally {
      setLocationLoading(false)
    }
  }

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces()
  }, [])

  // Handle location input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationInputValue.length > 2) {
        fetchLocations(locationInputValue, selectedProvince?.code)
      } else if (selectedProvince) {
        fetchLocations('', selectedProvince.code)
      } else {
        setLocations([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [locationInputValue, selectedProvince])

  // Set initial data when dialog opens
  useEffect(() => {
    if (data && open) {
      setUserData({
        nama_lengkap: data.nama_lengkap || data.fullName || '',
        no_hp: data.no_hp || '',
        email: data.email || '',
        status: data.is_active ? 'Active' : 'Inactive',
        location: data.location || '',
        address: data.address || '',
        password: '',
        confirmPassword: ''
      })
      
      // Set location if exists
      if (data.location) {
        setSelectedLocation({ code: '', name: data.location })
        setLocationInputValue(data.location)
        // Try to determine province from location name for better UX
        // This is optional - user can still select province manually
      } else {
        setSelectedLocation(null)
        setLocationInputValue('')
      }
      
      // Reset password visibility when dialog opens
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }, [data, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords match if provided
    if (userData?.password && userData.password !== userData.confirmPassword) {
      alert('Password dan konfirmasi password tidak cocok')
      return
    }
    
    // Validate required fields
    if (!userData?.nama_lengkap?.trim()) {
      alert('Nama lengkap harus diisi')
      return
    }
    
    if (!userData?.email?.trim()) {
      alert('Email harus diisi')
      return
    }
    
    try {
      const submitData: any = {
        nama_lengkap: userData.nama_lengkap.trim(),
        no_hp: userData.no_hp?.trim() || '',
        email: userData.email.trim(),
        is_active: userData.status === 'Active',
        location: selectedLocation?.name || '',
        address: userData.address?.trim() || ''
      }
      
      // Only add password if it's provided and not empty
      if (userData.password && userData.password.trim()) {
        submitData.password = userData.password
        submitData.password_confirmation = userData.confirmPassword
      }
      
      console.log('Submitting data:', submitData)
      
      // Get user UUID from data or current user context
      const userUuid = data?.uuid || 'me' // fallback to 'me' endpoint if no UUID
      
      const response = await fetch(`/api/users/${userUuid}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Gagal memperbarui profil')
      }
      
      // Success - close dialog and refresh parent data
      handleClose()
      
      // Call onSuccess callback to refresh parent component
      if (onSuccess) {
        onSuccess()
      }
      
      // Show success notification with toast
      toast.success('Profil berhasil diperbarui!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      
    } catch (error) {
      console.error('Error updating profile:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('JSON')) {
          toast.error('Server tidak memberikan respons yang valid. Silakan coba lagi.')
        } else if (error.message.includes('HTTP error')) {
          toast.error('Terjadi kesalahan koneksi. Silakan periksa koneksi internet Anda.')
        } else if (error.message.includes('NetworkError') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          toast.error('Tidak dapat terhubung ke server. Silakan periksa koneksi internet dan coba lagi.')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('Terjadi kesalahan saat memperbarui profil')
      }
    }
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleClose}
      maxWidth='md'
      scroll='body'
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Edit Profil
        <Typography component='span' className='flex flex-col text-center'>
          Edit Profil Pengguna.
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Nama Lengkap'
                placeholder='Masukkan nama lengkap'
                value={userData?.nama_lengkap || ''}
                onChange={e => setUserData({ ...userData, nama_lengkap: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='No. Handphone'
                placeholder='081234567890'
                value={userData?.no_hp || ''}
                onChange={e => setUserData({ ...userData, no_hp: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='email'
                label='Email'
                placeholder='contoh@email.com'
                value={userData?.email || ''}
                onChange={e => setUserData({ ...userData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                fullWidth
                options={provinces}
                getOptionLabel={(option) => option.name}
                value={selectedProvince}
                onChange={(event, newValue) => {
                  setSelectedProvince(newValue)
                  setSelectedLocation(null)
                  setLocationInputValue('')
                  if (newValue) {
                    fetchLocations('', newValue.code)
                  } else {
                    setLocations([])
                  }
                }}
                renderInput={(params) => (
                  <CustomTextField
                    {...params}
                    label='Provinsi'
                    placeholder='Pilih provinsi...'
                  />
                )}
                noOptionsText='Provinsi tidak ditemukan'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                fullWidth
                options={locations}
                getOptionLabel={(option) => option.name}
                value={selectedLocation}
                onChange={(event, newValue) => {
                  setSelectedLocation(newValue)
                  setUserData({ ...userData, location: newValue?.name || '' })
                }}
                inputValue={locationInputValue}
                onInputChange={(event, newInputValue) => {
                  setLocationInputValue(newInputValue)
                }}
                loading={locationLoading}
                disabled={!selectedProvince}
                renderInput={(params) => (
                  <CustomTextField
                    {...params}
                    label='Lokasi (Kabupaten/Kota)'
                    placeholder={selectedProvince ? 'Ketik untuk mencari kabupaten/kota...' : 'Pilih provinsi terlebih dahulu'}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {locationLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
                noOptionsText={locationInputValue.length > 2 ? 'Tidak ada data' : 'Ketik minimal 3 karakter untuk mencari'}
                clearOnBlur={false}
                selectOnFocus={true}
                handleHomeEndKeys={true}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                select
                label='Status'
                value={userData?.status || ''}
                onChange={e => setUserData({ ...userData, status: e.target.value })}
                disabled={!data?.roles?.includes('superadmin')}
                slotProps={{
                  input: {
                    style: { 
                      opacity: data?.roles?.includes('superadmin') ? 1 : 0.6,
                      cursor: data?.roles?.includes('superadmin') ? 'pointer' : 'not-allowed'
                    }
                  }
                }}
                helperText={!data?.roles?.includes('superadmin') ? 'Hanya superadmin yang dapat mengubah status' : ''}
              >
                <MenuItem value='Active'>Active</MenuItem>
                <MenuItem value='Inactive'>Inactive</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                multiline
                rows={3}
                label='Alamat Lengkap'
                placeholder='Jl. Contoh No. 123, RT/RW, Kelurahan, Kecamatan'
                value={userData?.address || ''}
                onChange={e => setUserData({ ...userData, address: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Password (Kosongkan jika tidak ingin diganti)'
                placeholder='Masukkan password baru'
                value={userData?.password || ''}
                onChange={e => {
                  setUserData({ ...userData, password: e.target.value })
                  // Show password field only when user types
                  if (e.target.value && !showPassword) {
                    setShowPassword(true)
                  }
                }}
                slotProps={{
                  input: {
                    endAdornment: userData?.password ? (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={() => setShowPassword(!showPassword)}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={showPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type={showConfirmPassword ? 'text' : 'password'}
                label='Konfirmasi Password'
                placeholder='Konfirmasi password baru'
                value={userData?.confirmPassword || ''}
                onChange={e => {
                  setUserData({ ...userData, confirmPassword: e.target.value })
                  // Show confirm password field only when user types
                  if (e.target.value && !showConfirmPassword) {
                    setShowConfirmPassword(true)
                  }
                }}
                disabled={!userData?.password}
                slotProps={{
                  input: {
                    endAdornment: userData?.confirmPassword ? (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={showConfirmPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' type='submit'>
            Update
          </Button>
          <Button variant='tonal' color='secondary' type='button' onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default EditUserInfo