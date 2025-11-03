'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Types
interface RegisterFormData {
  namaLengkap: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

// Styled Custom Components
const RegisterIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 680,
  maxInlineSize: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxBlockSize: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxBlockSize: 450
  }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 355,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

const RegisterV1Simple = ({ mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-register-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-register-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-register-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-register-light-border.png'

  // Hooks
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>({
    defaultValues: {
      namaLengkap: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    }
  })

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const watchedPassword = watch('password')

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
          password: data.password
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Registrasi berhasil! Silakan cek email Anda untuk kode verifikasi.')
        // Redirect to verification page with email
        window.location.href = `/auth/verify-email?email=${encodeURIComponent(data.email)}`
      } else {
        toast.error(result.message || 'Terjadi kesalahan saat registrasi')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <RegisterIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && (
          <MaskImg
            alt='mask'
            src={authBackground}
            className={classnames({ 'scale-x-[-1]': theme.direction === 'rtl' })}
          />
        )}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link
          href='/'
          className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'
        >
          <Logo />
        </Link>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{`Adventure starts here 🚀`}</Typography>
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
              name='password'
              control={control}
              rules={{
                required: 'Password harus diisi',
                minLength: { value: 6, message: 'Password minimal 6 karakter' }
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
              name='agreeToTerms'
              control={control}
              rules={{ required: 'Anda harus menyetujui syarat dan ketentuan' }}
              render={({ field: { value, onChange } }) => (
                <FormControlLabel
                  control={<Checkbox checked={value} onChange={onChange} />}
                  label={
                    <>
                      <span>Saya setuju dengan </span>
                      <Typography component={Link} href='/terms' color='primary.main'>
                        syarat dan ketentuan
                      </Typography>
                    </>
                  }
                />
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
            
            <Divider className='gap-2 text-textPrimary'>or</Divider>
            
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
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RegisterV1Simple