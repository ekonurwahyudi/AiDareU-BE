'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'
import type { ReactElement } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'

// Third-party Imports
import { toast } from 'react-toastify'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Types
type PixelStore = {
  uuid: string
  store_uuid: string
  pixel_type: string
  nama_pixel: string | null
  pixel_id: string | null
  convention_event: string | null
  test_code: string | null
  is_active: boolean
}

type DataType = {
  Keterangan: string
  namaPixel: string
  convention: string
  pixel: string
  KodeTesting: string
  conventionIcon: ReactElement
  pixelType: string
  data?: PixelStore
}

function RecentKeterangan({ storeUuid }: { storeUuid?: string | null }) {
  // States
  const [pixelStores, setPixelStores] = useState<PixelStore[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [editingPixel, setEditingPixel] = useState<DataType | null>(null)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [pixelToDelete, setPixelToDelete] = useState<DataType | null>(null)
  const [selectedPixelType, setSelectedPixelType] = useState<string>('')
  const [formData, setFormData] = useState({
    nama_pixel: '',
    pixel_id: '',
    convention_event: '',
    test_code: ''
  })
  const [saving, setSaving] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)

  // Pixel types configuration
  const pixelTypes = [
    {
      Keterangan: 'Facebook Pixel',
      pixelType: 'facebook_pixel',
      conventionIcon: <i className='tabler-brand-facebook text-[22px] text-info' />
    },
    {
      Keterangan: 'Tiktok Pixel',
      pixelType: 'tiktok_pixel',
      conventionIcon: <i className='tabler-brand-tiktok text-[22px] text-success' />
    },
    {
      Keterangan: 'Google Tag Manager',
      pixelType: 'google_tag_manager',
      conventionIcon: <i className='tabler-brand-google text-[22px] text-secondary' />
    }
  ]

  // Create display data from actual database entries
  const displayData: DataType[] = [...pixelStores.map(pixelStore => {
    const pixelTypeConfig = pixelTypes.find(pt => pt.pixelType === pixelStore.pixel_type)
    return {
      Keterangan: pixelTypeConfig?.Keterangan || pixelStore.pixel_type,
      namaPixel: pixelStore.nama_pixel || '',
      pixel: pixelStore.pixel_id || '',
      convention: pixelStore.convention_event || '',
      KodeTesting: pixelStore.test_code || '',
      conventionIcon: pixelTypeConfig?.conventionIcon || <i className='tabler-settings text-[22px] text-secondary' />,
      pixelType: pixelStore.pixel_type,
      data: pixelStore
    }
  })]

  // Add empty rows for pixel types that don't exist yet (for visual consistency)
  pixelTypes.forEach(pixelType => {
    const exists = pixelStores.some(ps => ps.pixel_type === pixelType.pixelType)
    if (!exists) {
      displayData.push({
        Keterangan: pixelType.Keterangan,
        namaPixel: '',
        pixel: '',
        convention: '',
        KodeTesting: '',
        conventionIcon: pixelType.conventionIcon,
        pixelType: pixelType.pixelType,
        data: undefined
      })
    }
  })

  // Fetch pixel stores data
  const fetchPixelStores = useCallback(async () => {
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

      // Use provided storeUuid if available
      if (storeUuid) {
        const res = await fetch(`${backendUrl}/api/public/pixel-stores?store_uuid=${storeUuid}`, {
          headers,
          credentials: 'include'
        })
        const json = await res.json()

        if (json.success) {
          setPixelStores(json.data || [])
        } else {
          setPixelStores([])
        }
      } else {
        // Fallback: get store via /api/users/me
        const userRes = await fetch(`${backendUrl}/api/users/me`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        })

        const userJson = await userRes.json()

        if (userJson.status === 'success' && userJson.data?.store) {
          const theStoreUuid = userJson.data.store.uuid
          const res = await fetch(`${backendUrl}/api/public/pixel-stores?store_uuid=${theStoreUuid}`, {
            headers,
            credentials: 'include'
          })
          const json = await res.json()

          if (json.success) {
            setPixelStores(json.data || [])
          }
        } else {
          // No store data
          setPixelStores([])
        }
      }
    } catch (error) {
      console.error('Error fetching pixel stores:', error)
      toast.error('Gagal memuat data pixel')
    } finally {
      setLoading(false)
    }
  }, [storeUuid])

  // Handle add new pixel
  const handleAddPixel = () => {
    setAddDialogOpen(true)
    setSelectedPixelType('')
    setFormData({
      nama_pixel: '',
      pixel_id: '',
      convention_event: '',
      test_code: ''
    })
  }

  // Handle pixel type selection
  const handlePixelTypeSelect = () => {
    if (!selectedPixelType) {
      toast.error('Pilih jenis pixel terlebih dahulu')
      return
    }

    const pixelTypeConfig = pixelTypes.find(p => p.pixelType === selectedPixelType)
    if (!pixelTypeConfig) return

    // Always create new pixel entry, even if the type already exists
    const pixelItem: DataType = {
      Keterangan: pixelTypeConfig.Keterangan,
      namaPixel: '',
      pixel: '',
      convention: '',
      KodeTesting: '',
      conventionIcon: pixelTypeConfig.conventionIcon,
      pixelType: pixelTypeConfig.pixelType,
      data: undefined // Force it to create new entry
    }

    setEditingPixel(pixelItem)
    setAddDialogOpen(false)
    setDialogOpen(true)
  }

  // Handle edit click
  const handleEdit = (item: DataType) => {
    setEditingPixel(item)
    setFormData({
      nama_pixel: item.namaPixel || '',
      pixel_id: item.pixel || '',
      convention_event: item.convention || '',
      test_code: item.KodeTesting || ''
    })
    setDialogOpen(true)
  }

  // Handle save
  const handleSave = async () => {
    if (!editingPixel) return

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

      // Tentukan storeUuid: pakai prop dulu, kalau tidak ada fallback ke /api/users/me
      let finalStoreUuid = storeUuid || null
      if (!finalStoreUuid) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
        const userRes = await fetch(`${backendUrl}/api/users/me`, {
          headers,
          credentials: 'include'
        })
        const userJson = await userRes.json()

        if (!userJson.data?.store?.uuid) {
          toast.error('Store tidak ditemukan')
          setSaving(false)
          return
        }
        finalStoreUuid = userJson.data.store.uuid
      }

      const isUpdate = editingPixel.data !== undefined

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
      const url = isUpdate
        ? `${backendUrl}/api/public/pixel-stores/${editingPixel.data!.uuid}`
        : `${backendUrl}/api/public/pixel-stores`

      const method = isUpdate ? 'PUT' : 'POST'

      const payload = isUpdate
        ? formData
        : {
            pixel_type: editingPixel.pixelType,
            store_uuid: finalStoreUuid,
            ...formData
          }

      const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const result = await res.json()

      if (result.success) {
        toast.success(isUpdate ? 'Pixel berhasil diperbarui' : 'Pixel berhasil ditambahkan')
        setDialogOpen(false)
        setEditingPixel(null)
        setFormData({
          nama_pixel: '',
          pixel_id: '',
          convention_event: '',
          test_code: ''
        })
        setTimeout(() => {
          fetchPixelStores()
        }, 100)
      } else {
        toast.error(result.message || 'Gagal menyimpan pixel')
      }
    } catch (error) {
      console.error('Error saving pixel:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete click
  const handleDeleteClick = (item: DataType) => {
    if (!item.data) return
    setPixelToDelete(item)
    setDeleteDialogOpen(true)
  }

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!pixelToDelete?.data) return

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

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
      const res = await fetch(`${backendUrl}/api/public/pixel-stores/${pixelToDelete.data.uuid}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      })

      const result = await res.json()

      if (result.success) {
        toast.success('Pixel berhasil dihapus')
        setDeleteDialogOpen(false)
        setPixelToDelete(null)
        // Small delay to ensure backend processing, then refresh data
        setTimeout(() => {
          fetchPixelStores()
        }, 100)
      } else {
        toast.error(result.message || 'Gagal menghapus pixel')
      }
    } catch (error) {
      console.error('Error deleting pixel:', error)
      toast.error('Terjadi kesalahan saat menghapus')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    fetchPixelStores()
  }, [])

  return (
    <>
      <Card>
        <CardHeader
          title="Setting Keterangan"
          subheader="Tambahkan Keterangan untuk Iklan yang Maximal."
          sx={{ pb: 1 }}
          action={
            <Button
              variant="contained"
              size="small"
              startIcon={<i className="tabler-plus" />}
              onClick={handleAddPixel}
            >
              Tambah Pixel
            </Button>
          }
        />
        <div className="overflow-x-auto px-6 pb-6">
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Keterangan</th>
                <th>Nama Pixel</th>
                <th>Pixel Id</th>
                <th>Convention/Event</th>
                <th>Kode Testing</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, index) => (
                <tr key={item.data?.uuid || `${item.pixelType}-${index}`}>
                  <td>
                    <div className="flex items-center gap-4">
                      {item.conventionIcon}
                      <Typography color="text.primary">{item.Keterangan}</Typography>
                    </div>
                  </td>
                  <td>
                    <Typography>{item.namaPixel || '-'}</Typography>
                  </td>
                  <td>
                    <Typography>{item.pixel || '-'}</Typography>
                  </td>
                  <td>
                    <Typography>{item.convention || '-'}</Typography>
                  </td>
                  <td>
                    <Typography>{item.KodeTesting || '-'}</Typography>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Tooltip title="Edit">
                        <IconButton size="small" color="secondary" onClick={() => handleEdit(item)}>
                          <i className="tabler-edit" />
                        </IconButton>
                      </Tooltip>
                      {item.data && (
                        <Tooltip title="Hapus">
                          <IconButton size="small" color="error" onClick={() => handleDeleteClick(item)}>
                            <i className="tabler-trash" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPixel?.data ? 'Edit' : 'Tambah'} {editingPixel?.Keterangan}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nama Pixel"
                value={formData.nama_pixel}
                onChange={(e) => setFormData({ ...formData, nama_pixel: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pixel ID"
                value={formData.pixel_id}
                onChange={(e) => setFormData({ ...formData, pixel_id: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Convention/Event"
                value={formData.convention_event}
                onChange={(e) => setFormData({ ...formData, convention_event: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Kode Testing"
                value={formData.test_code}
                onChange={(e) => setFormData({ ...formData, test_code: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saving || !formData.pixel_id.trim()}
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Pixel Type Selection Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Pilih Jenis Pixel
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Jenis Pixel</InputLabel>
            <Select
              value={selectedPixelType}
              label="Jenis Pixel"
              onChange={(e) => setSelectedPixelType(e.target.value)}
            >
              {pixelTypes.map((pixelType) => (
                <MenuItem key={pixelType.pixelType} value={pixelType.pixelType}>
                  <div className="flex items-center gap-3">
                    {pixelType.conventionIcon}
                    {pixelType.Keterangan}
                  </div>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Batal
          </Button>
          <Button 
            onClick={handlePixelTypeSelect} 
            variant="contained"
            disabled={!selectedPixelType}
          >
            Lanjut
          </Button>
        </DialogActions>
      </Dialog>

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
            Apakah Anda yakin ingin menghapus pixel <strong>{pixelToDelete?.Keterangan}</strong>?
            <br />
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

export default RecentKeterangan
