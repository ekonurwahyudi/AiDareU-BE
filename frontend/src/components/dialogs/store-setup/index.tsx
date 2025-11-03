'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'

type StoreSetupProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

interface StoreFormData {
  namaToko: string
  subDomain: string
  noHPToko: string
  kategoriToko: string
  deskripsiToko: string
}

// Store Categories
const storeCategories = [
  { value: 'fashion', label: 'Fashion & Pakaian' },
  { value: 'elektronik', label: 'Elektronik & Gadget' },
  { value: 'makanan', label: 'Makanan & Minuman' },
  { value: 'kesehatan', label: 'Kesehatan & Kecantikan' },
  { value: 'rumah_tangga', label: 'Rumah Tangga & Furnitur' },
  { value: 'olahraga', label: 'Olahraga & Outdoor' },
  { value: 'buku_media', label: 'Buku & Media' },
  { value: 'otomotif', label: 'Otomotif' },
  { value: 'mainan_hobi', label: 'Mainan & Hobi' },
  { value: 'jasa', label: 'Jasa & Layanan' },
  { value: 'lainnya', label: 'Lainnya' }
]

const StoreSetup = ({ open, setOpen }: StoreSetupProps) => {
  // States
  const [isLoading, setIsLoading] = useState(false)

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<StoreFormData>({
    defaultValues: {
      namaToko: '',
      subDomain: '',
      noHPToko: '',
      kategoriToko: '',
      deskripsiToko: ''
    }
  })

  const handleClose = () => {
    setOpen(false)
    reset()
  }

  const onSubmit = async (data: StoreFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/store/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nama_toko: data.namaToko,
          sub_domain: data.subDomain,
          no_hp_toko: data.noHPToko,
          kategori_toko: data.kategoriToko,
          deskripsi_toko: data.deskripsiToko
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Toko berhasil dibuat!')
        handleClose()
        // Redirect to dashboard with store created
        window.location.href = '/dashboard?store_created=true'
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

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  return (
    <Dialog
      fullWidth
      maxWidth='sm'
      open={open}
      onClose={!isLoading ? handleClose : undefined}
      scroll='body'
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose} disableRipple disabled={isLoading}>
        <i className='tabler-x' />
      </DialogCloseButton>
      
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        <div className='flex items-center gap-3 justify-center'>
          <div className='w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center'>
            <i className='tabler-store text-2xl text-primary' />
          </div>
          Informasi Toko
        </div>
        <Typography component='span' className='flex flex-col text-center text-textSecondary'>
          Lengkapi informasi toko Anda untuk mulai berjualan
        </Typography>
      </DialogTitle>
      
      <DialogContent className='pbs-0 sm:pli-16 sm:pbe-16'>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
          <Controller
            name='namaToko'
            control={control}
            rules={{
              required: 'Nama toko harus diisi',
              minLength: { value: 3, message: 'Nama toko minimal 3 karakter' },
              maxLength: { value: 50, message: 'Nama toko maksimal 50 karakter' }
            }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Nama Toko'
                placeholder='Masukkan nama toko Anda'
                error={!!errors.namaToko}
                helperText={errors.namaToko?.message || ''}
                onChange={(e) => {
                  field.onChange(e)
                  // Auto-generate subdomain suggestion
                  const subdomain = generateSubdomain(e.target.value)
                  // You can set the subdomain field here if needed
                }}
              />
            )}
          />

          <Controller
            name='subDomain'
            control={control}
            rules={{
              required: 'Sub domain harus diisi',
              pattern: {
                value: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
                message: 'Sub domain hanya boleh mengandung huruf kecil, angka, dan tanda hubung'
              },
              minLength: { value: 3, message: 'Sub domain minimal 3 karakter' },
              maxLength: { value: 30, message: 'Sub domain maksimal 30 karakter' }
            }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Sub Domain'
                placeholder='contoh: tokoanda'
                error={!!errors.subDomain}
                helperText={errors.subDomain?.message || `URL toko: ${field.value || 'subdomain'}.aidaru.com`}
                slotProps={{
                  input: {
                    startAdornment: (
                      <Typography variant='body2' color='textSecondary'>
                        https://
                      </Typography>
                    ),
                    endAdornment: (
                      <Typography variant='body2' color='textSecondary'>
                        .aidaru.com
                      </Typography>
                    )
                  }
                }}
              />
            )}
          />

          <Controller
            name='noHPToko'
            control={control}
            rules={{
              required: 'Nomor HP toko harus diisi',
              pattern: {
                value: /^(\+62|62|0)[0-9]{9,13}$/,
                message: 'Format nomor HP tidak valid (contoh: 08123456789)'
              }
            }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='No. HP Toko'
                placeholder='Masukkan nomor HP untuk toko'
                error={!!errors.noHPToko}
                helperText={errors.noHPToko?.message || ''}
              />
            )}
          />

          <Controller
            name='kategoriToko'
            control={control}
            rules={{ required: 'Kategori toko harus dipilih' }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                select
                fullWidth
                label='Kategori Toko'
                placeholder='Pilih kategori toko'
                error={!!errors.kategoriToko}
                helperText={errors.kategoriToko?.message || ''}
              >
                {storeCategories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </CustomTextField>
            )}
          />

          <Controller
            name='deskripsiToko'
            control={control}
            rules={{
              required: 'Deskripsi toko harus diisi',
              minLength: { value: 20, message: 'Deskripsi minimal 20 karakter' },
              maxLength: { value: 500, message: 'Deskripsi maksimal 500 karakter' }
            }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                multiline
                rows={4}
                label='Deskripsi Toko'
                placeholder='Ceritakan tentang toko Anda, produk yang dijual, dan keunggulan toko...'
                error={!!errors.deskripsiToko}
                helperText={errors.deskripsiToko?.message || ''}
              />
            )}
          />

          <div className='flex gap-4 justify-end pt-4'>
            <Button
              variant='outlined'
              onClick={handleClose}
              disabled={isLoading}
            >
              Lewati
            </Button>
            <Button
              type='submit'
              variant='contained'
              disabled={isLoading}
              className='min-w-32'
            >
              {isLoading ? 'Membuat...' : 'Buat Toko'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default StoreSetup