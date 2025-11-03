'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Third-party Imports
import { toast } from 'react-toastify'

// Types
type StoreItem = {
  id: number
  uuid: string
  name: string
  subdomain: string
  domain?: string
  phone: string
  category: string
  description: string
  url?: string
}

function DomainToko({ storeUuid }: { storeUuid?: string | null }) {
  // States
  const [stores, setStores] = useState<StoreItem[]>([])
  const [selectedStoreUuid, setSelectedStoreUuid] = useState<string>('')
  const [domain, setDomain] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)

  // Fetch stores
  const fetchStores = async () => {
    try {
      setLoading(true)

      // Use backend URL from environment variable
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

      // Get user data from localStorage
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')

      if (!storedUserData) {
        console.error('No user data found')
        setLoading(false)
        return
      }

      const user = JSON.parse(storedUserData)

      // Build headers for authentication
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (user.uuid) {
        headers['X-User-UUID'] = user.uuid
      }

      // Prefer storeUuid prop if provided
      if (storeUuid) {
        const res = await fetch(`${backendUrl}/api/public/stores/${storeUuid}`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        })
        const json = await res.json()

        if (res.ok && json.data) {
          const store = json.data
          const storesData: StoreItem[] = [{
            id: 0,
            uuid: store.uuid,
            name: store.name || '',
            subdomain: store.subdomain || '',
            domain: store.domain || '',
            phone: store.phone || '',
            category: store.category || '',
            description: store.description || ''
          }]
          setStores(storesData)
          setSelectedStoreUuid(store.uuid)
          setDomain(store.domain || '')
        } else {
          setStores([])
        }
      } else {
        // Fallback to fetching via /api/users/me
        const res = await fetch(`${backendUrl}/api/users/me`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        })

        const json = await res.json()

        if (json.status === 'success' && json.data?.store) {
          const store = json.data.store
          const storesData: StoreItem[] = [{
            id: 0,
            uuid: store.uuid,
            name: store.name || '',
            subdomain: store.subdomain || '',
            domain: store.domain || '',
            phone: store.phone || '',
            category: store.category || '',
            description: store.description || ''
          }]

          setStores(storesData)
          setSelectedStoreUuid(store.uuid)
          setDomain(store.domain || '')
        } else {
          // No store data
          setStores([])
        }
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err)
      toast.error('Gagal memuat data toko')
    } finally {
      setLoading(false)
    }
  }

  // Handle store selection change
  const handleStoreChange = (storeUuid: string) => {
    setSelectedStoreUuid(storeUuid)
    const selectedStore = stores.find(store => store.uuid === storeUuid)
    setDomain(selectedStore?.domain || '')
  }

  // Handle domain update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStoreUuid) {
      toast.error('Pilih toko terlebih dahulu')
      return
    }

    try {
      setSaving(true)

      // Get auth credentials
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')

      if (!storedUserData) {
        toast.error('User data tidak ditemukan')
        setSaving(false)
        return
      }

      const user = JSON.parse(storedUserData)

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (user.uuid) {
        headers['X-User-UUID'] = user.uuid
      }

      const payload = {
        domain: domain.trim()
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
      const res = await fetch(`${backendUrl}/api/public/stores/${selectedStoreUuid}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Domain berhasil diperbarui!')
        // Update local state
        setStores(stores.map(store =>
          store.uuid === selectedStoreUuid
            ? { ...store, domain: domain.trim() }
            : store
        ))
      } else {
        toast.error(data.message || 'Gagal memperbarui domain')
      }
    } catch (error) {
      console.error('Error updating domain:', error)
      toast.error('Terjadi kesalahan saat memperbarui domain')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete click
  const handleDeleteClick = () => {
    if (!selectedStoreUuid) {
      toast.error('Pilih toko terlebih dahulu')
      return
    }
    setDeleteDialogOpen(true)
  }

  // Handle domain deletion
  const handleDeleteConfirm = async () => {
    if (!selectedStoreUuid) return

    try {
      setDeleting(true)

      // Get auth credentials
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')

      if (!storedUserData) {
        toast.error('User data tidak ditemukan')
        setDeleting(false)
        return
      }

      const user = JSON.parse(storedUserData)

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (user.uuid) {
        headers['X-User-UUID'] = user.uuid
      }

      const payload = {
        domain: ''
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
      const res = await fetch(`${backendUrl}/api/public/stores/${selectedStoreUuid}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Domain berhasil dihapus!')
        // Update local state
        setStores(stores.map(store =>
          store.uuid === selectedStoreUuid
            ? { ...store, domain: '' }
            : store
        ))
        setDomain('')
        setDeleteDialogOpen(false)
      } else {
        toast.error(data.message || 'Gagal menghapus domain')
      }
    } catch (error) {
      console.error('Error deleting domain:', error)
      toast.error('Terjadi kesalahan saat menghapus domain')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    fetchStores()
  }, [])

  const selectedStore = stores.find(store => store.uuid === selectedStoreUuid)

  return (
    <>
    <Card>
      <CardHeader
        title="Domain Toko"
        subheader="Pengaturan Toko agar lebih mudah dikenali."
        sx={{ pb: 1 }}
      />
      <Divider className="mlb-4" />
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <Box className="flex justify-center items-center py-8">
            <Typography>Memuat data...</Typography>
          </Box>
        ) : stores.length === 0 ? (
          <Box className="flex justify-center items-center py-8">
            <Typography color="textSecondary">
              Data belum tersedia, silakan lengkapi di pengaturan toko
            </Typography>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              {/* Dropdown pilih Toko */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label="Pilih Toko"
                  value={selectedStoreUuid}
                  onChange={(e) => handleStoreChange(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="">-- Pilih Toko --</MenuItem>
                  {stores.map((store) => (
                    <MenuItem key={store.uuid} value={store.uuid}>
                      {store.name}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>

            {/* Input domain */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Domain"
                placeholder="contoh: tokosaya.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                helperText="Domain kustom untuk toko (tanpa https://)"
                disabled={loading || !selectedStoreUuid}
              />
            </Grid>

            {/* Store Info */}
            {selectedStore && (
              <Grid size={{ xs: 12 }}>
                <Box className="p-4 bg-gray-50 rounded-lg">
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2">
                        <strong>Nama Toko:</strong> {selectedStore.name}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2">
                        <strong>Subdomain:</strong> {selectedStore.subdomain}.aidareu.com
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2">
                        <strong>Domain Saat Ini:</strong> {selectedStore.domain || 'Belum diatur'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}

            {/* Tombol submit */}
            <Grid size={{ xs: 12 }} className="flex justify-end gap-4">
              <Button 
                variant="outlined" 
                onClick={() => window.open('https://www.domainesia.com/', '_blank')}
                startIcon={<i className="tabler-external-link" />}
              >
                Cek Domain
              </Button>
              {selectedStore?.domain && (
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={handleDeleteClick}
                  disabled={deleting || saving || !selectedStoreUuid}
                  startIcon={<i className="tabler-trash" />}
                >
                  {deleting ? 'Menghapus...' : 'Hapus Domain'}
                </Button>
              )}
              <Button 
                variant="contained" 
                type="submit"
                disabled={saving || deleting || !selectedStoreUuid}
                endIcon={<i className="tabler-check" />}
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </Grid>
          </Grid>
        </form>
        )}
      </CardContent>
    </Card>

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
          Apakah Anda yakin ingin menghapus domain <strong>{selectedStore?.domain}</strong>? 
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
  </>
  )
}

export default DomainToko