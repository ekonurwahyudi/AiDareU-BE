'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import FormHelperText from '@mui/material/FormHelperText'

// Third-party Imports 
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

interface BankAccountStepProps {
  handleNext: () => void
  handlePrev: () => void
  storeData: any
  setStoreData: (data: any) => void
}

// Validation Schema
const schema = yup.object().shape({
  accountOwner: yup.string().required('Nama pemilik rekening wajib diisi'),
  accountNumber: yup.string().required('Nomor rekening wajib diisi').min(8, 'Nomor rekening minimal 8 digit'),
  bankName: yup.string().required('Nama bank wajib dipilih')
})

const banks = [
  'BCA - Bank Central Asia',
  'BNI - Bank Negara Indonesia', 
  'BRI - Bank Rakyat Indonesia',
  'Mandiri - Bank Mandiri',
  'CIMB Niaga',
  'Danamon',
  'Permata Bank',
  'OCBC NISP',
  'Maybank Indonesia',
  'Bank Mega',
  'BII - Bank Internasional Indonesia',
  'Panin Bank',
  'BTPN',
  'Jenius',
  'Bank Syariah Indonesia (BSI)',
  'Bank Muamalat',
  'Lainnya'
]

const BankAccountStep = ({ handleNext, handlePrev, storeData, setStoreData }: BankAccountStepProps) => {
  // Form
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      accountOwner: storeData.accountOwner || '',
      accountNumber: storeData.accountNumber || '',
      bankName: storeData.bankName || ''
    }
  })

  const onSubmit = (data: any) => {
    // Update store data
    setStoreData({
      ...storeData,
      accountOwner: data.accountOwner,
      accountNumber: data.accountNumber,
      bankName: data.bankName
    })
    
    handleNext()
  }

  return (
    <Box>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
        <Grid item xs={12}>
          <Controller
            name='accountOwner'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Nama Pemilik Rekening'
                placeholder='Masukkan nama sesuai rekening bank'
                error={!!errors.accountOwner}
                helperText={errors.accountOwner?.message as string || ''}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name='accountNumber'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Nomor Rekening'
                placeholder='Masukkan nomor rekening bank'
                error={!!errors.accountNumber}
                helperText={errors.accountNumber?.message as string || ''}
                type="text"
                inputProps={{
                  pattern: '[0-9]*',
                  inputMode: 'numeric'
                }}
                onChange={(e) => {
                  // Only allow numbers
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  field.onChange(value)
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name='bankName'
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.bankName}>
                <InputLabel>Nama Bank</InputLabel>
                <Select {...field} label='Nama Bank'>
                  {banks.map((bank) => (
                    <MenuItem key={bank} value={bank}>
                      {bank}
                    </MenuItem>
                  ))}
                </Select>
                {errors.bankName && (
                  <FormHelperText>{errors.bankName?.message as string || ''}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>
      </Grid>

        <Box className='flex justify-between mt-8'>
          <Button
            variant='outlined'
            onClick={handlePrev}
            startIcon={<i className='tabler-arrow-left' />}
          >
            Sebelumnya
          </Button>
          <Button
            variant='contained'
            type='submit'
            endIcon={<i className='tabler-arrow-right' />}
          >
            Selanjutnya
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default BankAccountStep