'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Styled Component Imports
import AuthIllustrationWrapper from './AuthIllustrationWrapper'

// Types
interface RegisterFormData {
  namaLengkap: string
  email: string
  noHP: string
  password: string
  confirmPassword: string
  alasanGabung: string
  infoDari: string
  agreeToTerms: boolean
}

// Info Dari Options
const infoFromOptions = [
  { value: 'sosial_media', label: 'Sosial Media' },
  { value: 'grup_komunitas', label: 'Grup Komunitas' },
  { value: 'iklan', label: 'Iklan' },
  { value: 'google', label: 'Google' },
  { value: 'teman_saudara', label: 'Teman/Saudara' },
  { value: 'lainnya', label: 'Lainnya' }
]

const RegisterV1 = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>({
    defaultValues: {
      namaLengkap: '',
      email: '',
      noHP: '',
      password: '',
      confirmPassword: '',
      alasanGabung: '',
      infoDari: '',
      agreeToTerms: false
    }
  })

  const watchedPassword = watch('password')
  
  // Password validation criteria
  const getPasswordValidation = (password: string) => {
    return {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[@$!%*?&]/.test(password)
    }
  }
  
  const passwordValidation = getPasswordValidation(watchedPassword || '')

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Password dan Konfirmasi Password tidak cocok')
      return
    }

    if (!data.agreeToTerms) {
      toast.error('Anda harus menyetujui syarat dan ketentuan')
      return
    }

    setIsLoading(true)
    try {
      // Call registration API
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nama_lengkap: data.namaLengkap,
          email: data.email,
          no_hp: data.noHP,
          password: data.password,
          alasan_gabung: data.alasanGabung,
          info_dari: data.infoDari
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Registrasi berhasil! Silakan cek email Anda untuk kode verifikasi.')
        // Redirect to verification page with email
        window.location.href = `/auth/verify-email?email=${encodeURIComponent(data.email)}`
      } else {
        // Handle specific validation errors
        if (result.errors && result.errors.email) {
          toast.error('Email sudah terdaftar. Silakan gunakan email lain atau login.')
        } else {
          toast.error(result.message || 'Terjadi kesalahan saat registrasi')
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthIllustrationWrapper>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href='/' className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>Adventure starts here 🚀</Typography>
            <Typography>Make your app management easy and fun!</Typography>
          </div>
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            <Controller
              name='namaLengkap'
              control={control}
              rules={{
                required: 'Nama lengkap harus diisi',
                minLength: { value: 2, message: 'Nama lengkap minimal 2 karakter' }
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  autoFocus
                  fullWidth
                  label='Nama Lengkap'
                  placeholder='Masukkan nama lengkap Anda'
                  error={!!errors.namaLengkap}
                  helperText={errors.namaLengkap?.message}
                />
              )}
            />
            
            <Controller
              name='email'
              control={control}
              rules={{
                required: 'Email harus diisi',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Format email tidak valid'
                }
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Email'
                  placeholder='Masukkan email Anda'
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
            
            <Controller
              name='noHP'
              control={control}
              rules={{
                required: 'Nomor HP harus diisi',
                pattern: {
                  value: /^(\+62|62|0)[0-9]{9,13}$/,
                  message: 'Format nomor HP tidak valid (contoh: 08123456789)'
                }
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='No. HP'
                  placeholder='Masukkan nomor HP Anda'
                  error={!!errors.noHP}
                  helperText={errors.noHP?.message}
                />
              )}
            />
            
            <Controller
              name='password'
              control={control}
              rules={{
                required: 'Password harus diisi',
                minLength: { value: 8, message: 'Password minimal 8 karakter' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                  message: 'Password harus mengandung huruf kecil, huruf besar, angka, dan simbol (@$!%*?&)'
                }
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Password'
                  placeholder='············'
                  type={isPasswordShown ? 'text' : 'password'}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                            <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              )}
            />
            
            {/* Password Validation Indicators */}
            {watchedPassword && (
              <Box sx={{ mt: 1, mb: 2, p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}>
                  Persyaratan Password:
                </Typography>
                <List dense sx={{ py: 0 }}>
                  <ListItem sx={{ py: 0.25, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <i 
                        className={passwordValidation.length ? 'tabler-check' : 'tabler-x'} 
                        style={{ color: passwordValidation.length ? '#4caf50' : '#f44336', fontSize: '14px' }}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary='Must be at least 8 characters' 
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          fontSize: '0.75rem',
                          color: passwordValidation.length ? '#4caf50' : '#f44336'
                        }
                      }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.25, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <i 
                        className={passwordValidation.number ? 'tabler-check' : 'tabler-x'} 
                        style={{ color: passwordValidation.number ? '#4caf50' : '#f44336', fontSize: '14px' }}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary='Must contain at least 1 number' 
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          fontSize: '0.75rem',
                          color: passwordValidation.number ? '#4caf50' : '#f44336'
                        }
                      }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.25, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <i 
                        className={passwordValidation.uppercase ? 'tabler-check' : 'tabler-x'} 
                        style={{ color: passwordValidation.uppercase ? '#4caf50' : '#f44336', fontSize: '14px' }}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary='Must contain at least 1 Capital Case' 
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          fontSize: '0.75rem',
                          color: passwordValidation.uppercase ? '#4caf50' : '#f44336'
                        }
                      }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.25, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <i 
                        className={passwordValidation.lowercase ? 'tabler-check' : 'tabler-x'} 
                        style={{ color: passwordValidation.lowercase ? '#4caf50' : '#f44336', fontSize: '14px' }}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary='Must contain at least 1 Letter in Small Case' 
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          fontSize: '0.75rem',
                          color: passwordValidation.lowercase ? '#4caf50' : '#f44336'
                        }
                      }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.25, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <i 
                        className={passwordValidation.symbol ? 'tabler-check' : 'tabler-x'} 
                        style={{ color: passwordValidation.symbol ? '#4caf50' : '#f44336', fontSize: '14px' }}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary='Must contain at least 1 Special Character' 
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          fontSize: '0.75rem',
                          color: passwordValidation.symbol ? '#4caf50' : '#f44336'
                        }
                      }}
                    />
                  </ListItem>
                </List>
              </Box>
            )}
            
            <Controller
              name='confirmPassword'
              control={control}
              rules={{
                required: 'Konfirmasi password harus diisi',
                validate: (value) => value === watchedPassword || 'Password tidak cocok'
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Konfirmasi Password'
                  placeholder='············'
                  type={isConfirmPasswordShown ? 'text' : 'password'}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton edge='end' onClick={handleClickShowConfirmPassword} onMouseDown={e => e.preventDefault()}>
                            <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              )}
            />
            
            <Controller
              name='alasanGabung'
              control={control}
              rules={{
                required: 'Alasan gabung harus diisi',
                minLength: { value: 10, message: 'Alasan gabung minimal 10 karakter' }
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label='Alasan Gabung'
                  placeholder='Ceritakan alasan Anda ingin bergabung...'
                  error={!!errors.alasanGabung}
                  helperText={errors.alasanGabung?.message}
                />
              )}
            />
            
            <Controller
              name='infoDari'
              control={control}
              rules={{ required: 'Info dari harus dipilih' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  fullWidth
                  label='Info Dari'
                  placeholder='Pilih dari mana Anda mengetahui kami'
                  error={!!errors.infoDari}
                  helperText={errors.infoDari?.message}
                >
                  {infoFromOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
            />
            
            <Controller
              name='agreeToTerms'
              control={control}
              rules={{ required: 'Anda harus menyetujui syarat dan ketentuan' }}
              render={({ field: { value, onChange } }) => (
                <FormControl error={!!errors.agreeToTerms}>
                  <FormControlLabel
                    control={<Checkbox checked={value} onChange={onChange} />}
                    label={
                      <>
                        <span>Saya setuju dengan </span>
                        <Link className='text-primary' href='/' onClick={e => e.preventDefault()}>
                          kebijakan privasi & syarat dan ketentuan
                        </Link>
                      </>
                    }
                  />
                  {errors.agreeToTerms && (
                    <FormHelperText>{errors.agreeToTerms.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
            
            <Button 
              fullWidth 
              variant='contained' 
              type='submit'
              disabled={isLoading}
            >
              {isLoading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Sudah punya akun?</Typography>
              <Typography
                component={Link}
                href='/login'
                color='primary.main'
              >
                Masuk di sini
              </Typography>
            </div>
            {/* <Divider className='gap-2 text-textPrimary'>or</Divider>
            <div className='flex justify-center items-center gap-1.5'>
              <IconButton className='text-facebook' size='small'>
                <i className='tabler-brand-facebook-filled' />
              </IconButton>
              <IconButton className='text-twitter' size='small'>
                <i className='tabler-brand-twitter-filled' />
              </IconButton>
              <IconButton className='text-textPrimary' size='small'>
                <i className='tabler-brand-github-filled' />
              </IconButton>
              <IconButton className='text-error' size='small'>
                <i className='tabler-brand-google-filled' />
              </IconButton>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  )
}

export default RegisterV1
