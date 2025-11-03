'use client'

// React Imports
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'
import { toast } from 'react-toastify'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Styled Custom Components
const RegisterIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 600,
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
  maxBlockSize: 345,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

const Register = ({ mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    no_hp: '',
    password: '',
    confirm_password: '',
    alasan_gabung: '',
    info_dari: '',
    agree_terms: false
  })

  // Router
  const router = useRouter()

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

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    if (error) setError('')
  }

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      agree_terms: event.target.checked
    }))
  }

  const validateForm = () => {
    if (!formData.nama_lengkap.trim()) {
      setError('Nama lengkap harus diisi')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email harus diisi')
      return false
    }
    if (!formData.no_hp.trim()) {
      setError('Nomor HP harus diisi')
      return false
    }
    if (!formData.password) {
      setError('Password harus diisi')
      return false
    }
    if (formData.password !== formData.confirm_password) {
      setError('Konfirmasi password tidak cocok')
      return false
    }
    if (!formData.alasan_gabung.trim()) {
      setError('Alasan gabung harus diisi')
      return false
    }
    if (!formData.info_dari) {
      setError('Info dari mana harus dipilih')
      return false
    }
    if (!formData.agree_terms) {
      setError('Anda harus menyetujui syarat dan ketentuan')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama_lengkap: formData.nama_lengkap,
          email: formData.email,
          no_hp: formData.no_hp,
          password: formData.password,
          alasan_gabung: formData.alasan_gabung,
          info_dari: formData.info_dari
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan saat registrasi')
      }

      toast.success('Registrasi berhasil! Silakan cek email Anda untuk kode verifikasi.')
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      
    } catch (error: any) {
      setError(error.message)
      toast.error(error.message)
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
        {!hidden && <MaskImg alt='mask' src={authBackground} />}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link
          href='/login'
          className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'
        >
          <Logo />
        </Link>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>Adventure starts here 🚀</Typography>
            <Typography>Make your app management easy and fun!</Typography>
          </div>
          {error && (
            <Alert severity='error' className='mb-4'>
              {error}
            </Alert>
          )}
          <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-6'>
            <CustomTextField 
              autoFocus 
              fullWidth 
              label='Nama Lengkap' 
              placeholder='Masukkan nama lengkap Anda'
              value={formData.nama_lengkap}
              onChange={handleInputChange('nama_lengkap')}
              required
            />
            <CustomTextField 
              fullWidth 
              label='Email' 
              placeholder='Masukkan email Anda'
              type='email'
              value={formData.email}
              onChange={handleInputChange('email')}
              required
            />
            <CustomTextField 
              fullWidth 
              label='No. HP' 
              placeholder='Masukkan nomor HP Anda'
              value={formData.no_hp}
              onChange={handleInputChange('no_hp')}
              required
            />
            <CustomTextField
              fullWidth
              label='Password'
              placeholder='············'
              type={isPasswordShown ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              required
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
            <CustomTextField
              fullWidth
              label='Konfirmasi Password'
              placeholder='············'
              type={isConfirmPasswordShown ? 'text' : 'password'}
              value={formData.confirm_password}
              onChange={handleInputChange('confirm_password')}
              required
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
            <CustomTextField 
              fullWidth 
              label='Alasan Gabung' 
              placeholder='Ceritakan alasan Anda bergabung'
              multiline
              rows={3}
              value={formData.alasan_gabung}
              onChange={handleInputChange('alasan_gabung')}
              required
            />
            <CustomTextField
              fullWidth
              select
              label='Info Dari'
              value={formData.info_dari}
              onChange={handleInputChange('info_dari')}
              required
            >
              <MenuItem value=''>Pilih sumber informasi</MenuItem>
              <MenuItem value='Sosial Media'>Sosial Media</MenuItem>
              <MenuItem value='Teman'>Teman</MenuItem>
              <MenuItem value='Google'>Google</MenuItem>
              <MenuItem value='Iklan'>Iklan</MenuItem>
              <MenuItem value='Lainnya'>Lainnya</MenuItem>
            </CustomTextField>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={formData.agree_terms}
                  onChange={handleCheckboxChange}
                />
              }
              label={
                <>
                  <span>Saya setuju dengan </span>
                  <Link className='text-primary' href='/privacy-policy' target='_blank'>
                    kebijakan privasi & syarat dan ketentuan
                  </Link>
                </>
              }
            />
            <Button 
              fullWidth 
              variant='contained' 
              type='submit'
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Already have an account?</Typography>
              <Typography component={Link} href='/login' color='primary.main'>
                Sign in instead
              </Typography>
            </div>
            {/* <Divider className='gap-2'>or</Divider>
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
        </div>
      </div>
    </div>
  )
}

export default Register
