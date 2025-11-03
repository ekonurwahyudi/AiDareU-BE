'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'

// Icon Imports
import { Icon } from '@iconify/react'

interface StoreSetupModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface StoreFormData {
  nama_toko: string
  subdomain: string
  no_hp_toko: string
  kategori_toko: string
  deskripsi_toko: string
}

const kategoriOptions = [
  { value: 'fashion', label: 'Fashion & Pakaian' },
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'makanan', label: 'Makanan & Minuman' },
  { value: 'kecantikan', label: 'Kecantikan & Kesehatan' },
  { value: 'rumah', label: 'Rumah & Taman' },
  { value: 'olahraga', label: 'Olahraga & Outdoor' },
  { value: 'otomotif', label: 'Otomotif' },
  { value: 'buku', label: 'Buku & Alat Tulis' },
  { value: 'mainan', label: 'Mainan & Hobi' },
  { value: 'lainnya', label: 'Lainnya' }
]

const StoreSetupModal = ({ open, onClose, onSuccess }: StoreSetupModalProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<StoreFormData>({
    defaultValues: {
      nama_toko: '',
      subdomain: '',
      no_hp_toko: '',
      kategori_toko: '',
      deskripsi_toko: ''
    }
  })

  const watchedNamaToko = watch('nama_toko')
  const watchedSubdomain = watch('subdomain')

  // Auto-generate subdomain from store name
  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20)
  }

  // Check subdomain availability
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null)
      return
    }

    setCheckingSubdomain(true)
    try {
      const response = await fetch(`/api/stores/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      const result = await response.json()
      setSubdomainAvailable(result.available)
    } catch (error) {
      console.error('Error checking subdomain:', error)
      setSubdomainAvailable(null)
    } finally {
      setCheckingSubdomain(false)
    }
  }

  const onSubmit = async (data: StoreFormData) => {
    if (!subdomainAvailable) {
      toast.error('Subdomain tidak tersedia atau belum dicek')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Toko berhasil dibuat!')
        reset()
        onSuccess()
        onClose()
      } else {
        toast.error(result.message || 'Gagal membuat toko')
      }
    } catch (error) {
      console.error('Store creation error:', error)
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setSubdomainAvailable(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center justify-between">
        <div>
          <Typography variant="h5" component="div">
            Setup Toko Anda
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lengkapi informasi toko untuk memulai berjualan
          </Typography>
        </div>
        <IconButton onClick={handleClose} size="small">
          <Icon icon="tabler:x" />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className="space-y-4">
          <Controller
            name="nama_toko"
            control={control}
            rules={{ 
              required: 'Nama toko wajib diisi',
              minLength: { value: 3, message: 'Nama toko minimal 3 karakter' }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nama Toko"
                placeholder="Masukkan nama toko Anda"
                error={!!errors.nama_toko}
                helperText={errors.nama_toko?.message || ''}
                onChange={(e) => {
                  field.onChange(e)
                  // Auto-generate subdomain
                  const generatedSubdomain = generateSubdomain(e.target.value)
                  setValue('subdomain', generatedSubdomain)
                  if (generatedSubdomain.length >= 3) {
                    checkSubdomainAvailability(generatedSubdomain)
                  }
                }}
              />
            )}
          />

          <Controller
            name="subdomain"
            control={control}
            rules={{ 
              required: 'Subdomain wajib diisi',
              minLength: { value: 3, message: 'Subdomain minimal 3 karakter' },
              pattern: {
                value: /^[a-z0-9]+$/,
                message: 'Subdomain hanya boleh huruf kecil dan angka'
              }
            }}
            render={({ field }) => (
              <Box>
                <TextField
                  {...field}
                  fullWidth
                  label="Subdomain"
                  placeholder="namatoko"
                  error={!!errors.subdomain || subdomainAvailable === false}
                  helperText={
                    errors.subdomain?.message ||
                    (checkingSubdomain ? 'Mengecek ketersediaan...' :
                     subdomainAvailable === true ? 'Subdomain tersedia!' :
                     subdomainAvailable === false ? 'Subdomain sudah digunakan' :
                     'Subdomain akan menjadi: ' + watchedSubdomain + '.aidareu.com')
                  }
                  InputProps={{
                    endAdornment: (
                      <Typography variant="body2" color="text.secondary">
                        .aidareu.com
                      </Typography>
                    )
                  }}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')
                    field.onChange(value)
                    if (value.length >= 3) {
                      checkSubdomainAvailability(value)
                    } else {
                      setSubdomainAvailable(null)
                    }
                  }}
                />
                {subdomainAvailable === true && (
                  <Typography variant="caption" color="success.main" className="flex items-center gap-1 mt-1">
                    <Icon icon="tabler:check" fontSize={16} />
                    Subdomain tersedia
                  </Typography>
                )}
                {subdomainAvailable === false && (
                  <Typography variant="caption" color="error.main" className="flex items-center gap-1 mt-1">
                    <Icon icon="tabler:x" fontSize={16} />
                    Subdomain sudah digunakan
                  </Typography>
                )}
              </Box>
            )}
          />

          <Controller
            name="no_hp_toko"
            control={control}
            rules={{ 
              required: 'Nomor HP toko wajib diisi',
              pattern: {
                value: /^[0-9+\-\s]+$/,
                message: 'Format nomor HP tidak valid'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nomor HP Toko"
                placeholder="08xxxxxxxxxx"
                error={!!errors.no_hp_toko}
                helperText={errors.no_hp_toko?.message || ''}
              />
            )}
          />

          <Controller
            name="kategori_toko"
            control={control}
            rules={{ required: 'Kategori toko wajib dipilih' }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Kategori Toko"
                error={!!errors.kategori_toko}
                helperText={errors.kategori_toko?.message || ''}
              >
                {kategoriOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="deskripsi_toko"
            control={control}
            rules={{ 
              required: 'Deskripsi toko wajib diisi',
              minLength: { value: 10, message: 'Deskripsi minimal 10 karakter' }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={3}
                label="Deskripsi Toko"
                placeholder="Ceritakan tentang toko Anda..."
                error={!!errors.deskripsi_toko}
                helperText={errors.deskripsi_toko?.message || ''}
              />
            )}
          />
        </DialogContent>

        <DialogActions className="p-6 pt-0">
          <Button onClick={handleClose} disabled={isLoading}>
            Batal
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading || !subdomainAvailable}
          >
            {isLoading ? 'Membuat Toko...' : 'Buat Toko'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default StoreSetupModal