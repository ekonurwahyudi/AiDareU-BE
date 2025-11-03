'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'

// Icon Imports
import { Icon } from '@iconify/react'

// Component Imports
import StoreSetupModal from '@/components/modals/StoreSetupModal'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

interface User {
  id: number
  nama_lengkap: string
  email: string
  no_hp: string
  stores?: Store[]
}

interface Store {
  id: number
  nama_toko: string
  subdomain: string
  kategori_toko: string
  deskripsi_toko: string
  is_active: boolean
}

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
        
        // Show store setup modal if user has no stores
        if (!result.user.stores || result.user.stores.length === 0) {
          setShowStoreModal(true)
        }
      } else {
        localStorage.removeItem('token')
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleStoreCreated = () => {
    // Refresh user data to get the new store
    fetchUserData()
  }

  if (loading) {
    return (
      <RBACProvider>
        <Box className="p-6">
          <Skeleton variant="text" width={300} height={40} className="mb-4" />
          <Grid container spacing={4}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} md={4} key={item}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={30} />
                    <Skeleton variant="text" width="80%" height={20} className="mt-2" />
                    <Skeleton variant="rectangular" width="100%" height={100} className="mt-4" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </RBACProvider>
    )
  }

  return (
    <RBACProvider>
      <Box className="p-6">
        <div className="mb-6">
          <Typography variant="h4" className="mb-2">
            Selamat Datang, {user?.nama_lengkap}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Kelola toko online Anda dengan mudah
          </Typography>
        </div>

        {user?.stores && user.stores.length > 0 ? (
          <Grid container spacing={4}>
            {user.stores.map((store) => (
              <Grid item xs={12} md={6} lg={4} key={store.id}>
                <Card className="h-full">
                  <CardContent>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Typography variant="h6" className="mb-1">
                          {store.nama_toko}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {store.subdomain}.aidareu.com
                        </Typography>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        store.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {store.is_active ? 'Aktif' : 'Nonaktif'}
                      </div>
                    </div>
                    
                    <Typography variant="body2" className="mb-4 line-clamp-3">
                      {store.deskripsi_toko}
                    </Typography>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<Icon icon="tabler:edit" />}
                        onClick={() => router.push(`/stores/${store.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<Icon icon="tabler:eye" />}
                        onClick={() => window.open(`https://${store.subdomain}.aidareu.com`, '_blank')}
                      >
                        Lihat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            {/* Add New Store Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Card className="h-full border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Icon icon="tabler:plus" className="text-4xl text-gray-400 mb-4" />
                  <Typography variant="h6" className="mb-2">
                    Buat Toko Baru
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mb-4">
                    Tambahkan toko online baru untuk memperluas bisnis Anda
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => setShowStoreModal(true)}
                    startIcon={<Icon icon="tabler:plus" />}
                  >
                    Buat Toko
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Icon icon="tabler:store" className="text-6xl text-gray-400 mb-4" />
              <Typography variant="h5" className="mb-2">
                Belum Ada Toko
              </Typography>
              <Typography variant="body1" color="text.secondary" className="mb-6">
                Mulai berjualan online dengan membuat toko pertama Anda
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => setShowStoreModal(true)}
                startIcon={<Icon icon="tabler:plus" />}
              >
                Buat Toko Pertama
              </Button>
            </CardContent>
          </Card>
        )}

        <StoreSetupModal 
          open={showStoreModal}
          onClose={() => setShowStoreModal(false)}
          onSuccess={handleStoreCreated}
        />
      </Box>
    </RBACProvider>
  )
}

export default DashboardPage