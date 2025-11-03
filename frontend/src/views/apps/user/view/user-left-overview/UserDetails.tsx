'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import type { ButtonProps } from '@mui/material/Button'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import EditUserInfo from '@components/dialogs/edit-user-info'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import CustomAvatar from '@core/components/mui/Avatar'

// Types
type UserData = {
  uuid?: string
  name?: string
  nama_lengkap?: string
  no_hp?: string
  email?: string
  is_active?: boolean
  roles?: string[]
  created_at?: string
  location?: string
  address?: string
}

const UserDetails = () => {
  // States
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user data from API
  const fetchUserData = async (retryCount = 0) => {
    try {
      setLoading(true)
      setError(null)

      // Use backend URL from environment variable
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
      const apiUrl = `${backendUrl}/api/users/me`

      console.log('Fetching user data from:', apiUrl)

      // Get stored user data for authentication
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }

      // Add auth token if available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      // Add user UUID header as fallback
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData)
          if (userData.uuid) {
            headers['X-User-UUID'] = userData.uuid
          }
        } catch (e) {
          console.error('Failed to parse stored user data:', e)
        }
      }

      const response = await fetch(apiUrl, {
        headers,
        credentials: 'include' // for session-based auth
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('Non-JSON response:', textResponse)
        throw new Error('Server tidak memberikan respons JSON yang valid')
      }
      
      const result = await response.json()
      console.log('API Response:', result)

      if (result.success || result.status === 'success') {
        setUserData(result.data)
      } else {
        throw new Error(result.message || 'Gagal mengambil data pengguna')
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
      
      // Retry mechanism for network errors
      if (retryCount < 2 && (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch')))) {
        console.log(`Retrying request (attempt ${retryCount + 1}/3)...`)
        setTimeout(() => fetchUserData(retryCount + 1), 1000)
        return
      }
      
      if (err instanceof Error) {
        if (err.message.includes('JSON')) {
          setError('Server tidak memberikan respons yang valid. Silakan refresh halaman.')
        } else if (err.message.includes('HTTP error')) {
          setError('Terjadi kesalahan koneksi. Silakan periksa koneksi internet Anda.')
        } else if (err.message.includes('NetworkError') || err.message.includes('fetch') || err instanceof TypeError) {
          setError('Tidak dapat terhubung ke server. Pastikan server backend berjalan.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Terjadi kesalahan tidak dikenal')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Vars
  const buttonProps = (children: string, color: ThemeColor, variant: ButtonProps['variant']): ButtonProps => ({
    children,
    color,
    variant
  })

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center p-12'>
          <CircularProgress />
          <Typography className='ml-4'>Memuat data pengguna...</Typography>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error || !userData) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center p-12 gap-4'>
          <Typography color='error'>Error: {error || 'Data pengguna tidak ditemukan'}</Typography>
          <Button variant='outlined' onClick={() => fetchUserData()}>
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className='flex flex-col pbs-12 gap-6'>
          <div className='flex flex-col gap-6'>
            <div className='flex items-center justify-center flex-col gap-4'>
              <div className='flex flex-col items-center gap-4'>
                <CustomAvatar alt='user-profile' src='/images/avatars/1.png' variant='rounded' size={120} />
                <Typography variant='h5'>{userData.nama_lengkap || userData.name || 'User'}</Typography>
              </div>
              <Chip 
                label={
                  userData.roles && userData.roles.length > 0 
                    ? userData.roles[0].toUpperCase() 
                    : 'USER'
                } 
                color={
                  userData.roles?.[0] === 'owner' ? 'warning' : 
                  userData.roles?.[0] === 'superadmin' ? 'primary' : 
                  'default'
                } 
                size='small' 
                variant='tonal' 
              />
            </div>
            <div className='flex items-center justify-around flex-wrap gap-4'>
              <div className='flex items-center gap-4'>
                <CustomAvatar variant='rounded' color='primary' skin='light'>
                  <i className='tabler-box' />
                </CustomAvatar>
                <div>
                  <Typography variant='h5' className='text-center'>10</Typography>
                  <Typography>Product</Typography>
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <CustomAvatar variant='rounded' color='success' skin='light'>
                  <i className='tabler-cash-register' />
                </CustomAvatar>
                <div>
                  <Typography variant='h5' className='text-center'>Rp. 4.762.200</Typography>
                  <Typography>Billing Revenue</Typography>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Typography variant='h5'>Details</Typography>
            <Divider className='mlb-4' />
            <div className='flex flex-col gap-2'>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Nama Lengkap:
                </Typography>
                <Typography>{userData.nama_lengkap || userData.name || '-'}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  No Hp:
                </Typography>
                <Typography>{userData.no_hp || '-'}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Email:
                </Typography>
                <Typography color='text.primary'>{userData.email || '-'}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Lokasi:
                </Typography>
                <Typography color='text.primary'>{userData.location || '-'}</Typography>
              </div>
               <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Alamat:
                </Typography>
                <Typography color='text.primary'>{userData.address || '-'}</Typography>
              </div>
              <div className='flex items-center gap-1'>
              <Typography color='text.primary' className='font-medium'>
                Status:
              </Typography>
              <Chip 
                label={userData.is_active ? 'Active' : 'Inactive'} 
                variant='tonal' 
                color={userData.is_active ? 'success' : 'error'} 
                size='small' 
              />
            </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Bergabung Sejak:
                </Typography>
                <Typography color='text.primary'>{formatDate(userData.created_at)}</Typography>
              </div>
            </div>
          </div>
         <div className='flex w-full'>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={{
                ...buttonProps('Edit Profil', 'primary', 'contained'), // ganti 'tonal' ke 'contained'
                startIcon: <i className='tabler-user-edit' />,
                fullWidth: true // pastikan tombol memenuhi lebar container
              }}
              dialog={EditUserInfo}
              dialogProps={{ 
                data: userData,
                onSuccess: () => {
                  // Refresh user data after successful update
                  fetchUserData()
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default UserDetails
