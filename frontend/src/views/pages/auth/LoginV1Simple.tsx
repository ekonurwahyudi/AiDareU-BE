'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Styled Component Imports
import AuthIllustrationWrapper from './AuthIllustrationWrapper'

// Types
interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const LoginV1Simple = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorState, setErrorState] = useState<string | null>(null)
  
  // Hooks
  const router = useRouter()

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setErrorState(null)

    try {
      // Direct API call to backend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: data.email,
          password: data.password 
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        if (result.requires_verification) {
          // Store user data for verification flow
          localStorage.setItem('unverified_user', JSON.stringify({
            user: result.user,
            token: result.token,
            email: data.email,
            password: data.password
          }))
          
          toast.success('Login berhasil! Silakan verifikasi email Anda.')
          router.push('/auth/verify-email')
        } else {
          // User verified, proceed to dashboard
          localStorage.setItem('auth_token', result.token)
          localStorage.setItem('user_data', JSON.stringify(result.user))
          
          toast.success('Login berhasil!')
          router.push('/dashboards/ecommerce')
        }
      } else {
        const errorMessage = result.message || 'Login gagal'
        setErrorState(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = 'Terjadi kesalahan koneksi. Silakan coba lagi.'
      setErrorState(errorMessage)
      toast.error(errorMessage)
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
            <Typography variant='h4'>Welcome to AiDareu! 👋🏻</Typography>
            <Typography>Please sign-in to your account and start the adventure</Typography>
          </div>
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
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
                  autoFocus
                  fullWidth
                  label='Email'
                  placeholder='Masukkan email Anda'
                  onChange={(e) => {
                    field.onChange(e)
                    if (errorState) setErrorState(null)
                  }}
                  error={!!errors.email || !!errorState}
                  helperText={errors.email?.message || errorState}
                />
              )}
            />
            
            <Controller
              name='password'
              control={control}
              rules={{
                required: 'Password harus diisi'
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Password'
                  placeholder='············'
                  type={isPasswordShown ? 'text' : 'password'}
                  onChange={(e) => {
                    field.onChange(e)
                    if (errorState) setErrorState(null)
                  }}
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
            
            <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
              <Controller
                name='rememberMe'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={<Checkbox checked={value} onChange={onChange} />}
                    label='Remember me'
                  />
                )}
              />
              <Typography
                className='text-end'
                color='primary.main'
                component={Link}
                href='/auth/forgot-password'
              >
                Forgot password?
              </Typography>
            </div>
            
            <Button 
              fullWidth 
              variant='contained' 
              type='submit'
              disabled={isLoading}
            >
              {isLoading ? 'Masuk...' : 'Masuk'}
            </Button>
            
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Belum punya akun?</Typography>
              <Typography
                component={Link}
                href='/registrasi'
                color='primary.main'
              >
                Daftar di sini
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

export default LoginV1Simple