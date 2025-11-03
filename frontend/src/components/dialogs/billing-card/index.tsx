'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'

// Component Imports
import DialogCloseButton from '../DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'

// Third-party Imports
import { toast } from 'react-toastify'

// Types
import type { ThemeColor } from '@core/types'

type BillingCardData = {
  uuid?: string
  cardNumber?: string
  name?: string
  bank?: string
  is_primary?: boolean
  badgeColor?: ThemeColor
}

type BillingCardProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: BillingCardData
  onSuccess?: () => void
}

const initialCardData: BillingCardData = {
  cardNumber: '',
  name: '',
  bank: '',
  is_primary: false,
  badgeColor: 'primary'
}

// Logo bank online sementara (gunakan URL gambar)
const bankOptions = [
  { name: 'BCA', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/1199px-Bank_Central_Asia.svg.png' },
  { name: 'BNI', logo: 'https://upload.wikimedia.org/wikipedia/id/thumb/5/55/BNI_logo.svg/300px-BNI_logo.svg.png?20240305030303' },
  { name: 'BRI', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/BANK_BRI_logo.svg/189px-BANK_BRI_logo.svg.png' },
  { name: 'Mandiri', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/320px-Bank_Mandiri_logo_2016.svg.png' }
]

const BillingCard = ({ open, setOpen, data, onSuccess, storeUuid }: { open: boolean; setOpen: (open: boolean) => void; data?: BillingCardData; onSuccess?: () => void; storeUuid?: string | null }) => {
  const [cardData, setCardData] = useState(initialCardData)
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setOpen(false)
    setCardData(initialCardData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cardData.cardNumber || !cardData.name || !cardData.bank) {
      toast.error('Mohon lengkapi semua field')
      return
    }

    setLoading(true)
    try {
      let payload: Record<string, any> = {
        account_number: cardData.cardNumber,
        account_name: cardData.name,
        bank_name: cardData.bank,
        is_primary: cardData.is_primary || false
      }

      const url = data?.uuid 
        ? `/api/public/bank-accounts/${data.uuid}` 
        : '/api/public/bank-accounts'
      
      const method = data?.uuid ? 'PUT' : 'POST'

      // Saat membuat rekening baru, sertakan store_uuid dari props atau fallback ke /api/users/me
      if (!data?.uuid) {
        let finalStoreUuid = storeUuid || null

        if (!finalStoreUuid) {
          const userRes = await fetch('/api/users/me', {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            cache: 'no-store'
          })
          const userJson = await userRes.json()
          finalStoreUuid = userJson?.data?.store?.uuid || null
        }

        if (!finalStoreUuid) {
          toast.error('Store tidak ditemukan')
          setLoading(false)
          return
        }

        payload = { ...payload, store_uuid: finalStoreUuid }
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success(data?.uuid ? 'Rekening berhasil diperbarui' : 'Rekening berhasil ditambahkan')
        handleClose()
        onSuccess?.()
      } else {
        toast.error(result.message || 'Terjadi kesalahan')
      }
    } catch (error) {
      console.error('Error saving bank account:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCardData(data ?? initialCardData)
  }, [open, data])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose} disableRipple>
        <i className="tabler-x" />
      </DialogCloseButton>
      <DialogTitle variant="h4" className="text-center p-6">
        {data ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}<br/>
        <Typography component="span" className="text-center">
          {data
            ? 'Edit rekening bank yang tersimpan'
            : 'Tambahkan rekening untuk penarikan dana'}
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="p-6">
          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label="Nomor Rekening"
                placeholder="1234567890"
                value={cardData.cardNumber}
                onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Nama Pemilik"
                placeholder="John Doe"
                value={cardData.name}
                onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label="Pilih Bank"
                value={cardData.bank}
                onChange={(e) => setCardData({ ...cardData, bank: e.target.value })}
                required
              >
                <MenuItem value="">-- Pilih Bank --</MenuItem>
                {bankOptions.map((bank, idx) => (
                 <MenuItem key={idx} value={bank.name}>
                    <Box className="flex items-center gap-2">
                      <img
                        src={bank.logo}
                        alt={bank.name}
                        style={{
                          height: 20,
                          width: 'auto',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                      />
                      <span>{bank.name}</span>
                    </Box>
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={cardData.is_primary} 
                    onChange={(e) => setCardData({ ...cardData, is_primary: e.target.checked })}
                  />
                }
                label="Simpan sebagai rekening utama?"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="justify-center p-6">
          <Button 
            variant="contained" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : (data ? 'Update' : 'Tambah')}
          </Button>
          <Button variant="tonal" color="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default BillingCard
