'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { email, object, string, pipe, nonEmpty, minLength, regex, custom } from 'valibot'
import type { SubmitHandler } from 'react-hook-form'
import type { InferInput } from 'valibot'
import { toast } from 'react-toastify'
import { OTPInput } from 'input-otp'
import type { SlotProps } from 'input-otp'
import classnames from 'classnames'

// Component Imports
import DirectionalIcon from '@components/DirectionalIcon'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Styled Component Imports
import AuthIllustrationWrapper from './AuthIllustrationWrapper'

// Style Imports
import styles from '@/libs/styles/inputOtp.module.css'

// Form Schema
const schema = object({
  email: pipe(string(), nonEmpty('Email is required'), email('Email format is invalid')),
  code: pipe(string(), nonEmpty('Verification code is required'), minLength(6, 'Code must be 6 digits')),
  password: pipe(
    string(),
    nonEmpty('Password is required'),
    minLength(8, 'Password must be at least 8 characters'),
    regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and 1 symbol (@$!%*?&)')
  ),
  password_confirmation: pipe(string(), nonEmpty('Password confirmation is required'))
}, [
  custom(input => input.password === input.password_confirmation, 'Passwords must match')
])

type FormData = InferInput<typeof schema>

const Slot = (props: SlotProps) => {
  return (
    <div className={classnames(styles.slot, { [styles.slotActive]: props.isActive })}>
      {props.char !== null && <div>{props.char}</div>}
      {props.hasFakeCaret && <FakeCaret />}
    </div>
  )
}

const FakeCaret = () => {
  return (
    <div className={styles.fakeCaret}>
      <div className='w-px h-5 bg-textPrimary' />
    </div>
  )
}

const ResetPasswordV1 = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorState, setErrorState] = useState<{ message: string[] } | null>(null)
  const [otp, setOtp] = useState<string | null>(null)

  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      email: '',
      code: '',
      password: '',
      password_confirmation: ''
    }
  })

  const watchedPassword = watch('password')

  useEffect(() => {
    // Get email from URL params
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setValue('email', emailParam)
    }
  }, [searchParams, setValue])

  useEffect(() => {
    if (otp) {
      setValue('code', otp)
    }
  }, [otp, setValue])

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  // Password validation indicators
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

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {
    setIsLoading(true)
    setErrorState(null)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: data.email,
          code: data.code,
          password: data.password,
          password_confirmation: data.password_confirmation
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Password berhasil direset! Silakan login dengan password baru.')
        router.push('/login')
      } else {
        if (result.errors) {
          const errorMessages = Object.values(result.errors).flat() as string[]
          setErrorState({ message: errorMessages })
        } else {
          const errorMessage = result.message || 'Gagal mereset password'
          setErrorState({ message: [errorMessage] })
          toast.error(errorMessage)
        }
      }
    } catch (error) {
      console.error('Reset password error:', error)
      const errorMessage = 'Terjadi kesalahan koneksi. Silakan coba lagi.'
      setErrorState({ message: [errorMessage] })
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
            <Typography variant='h4'>Reset Password 🔒</Typography>
            <Typography>Masukkan kode reset dan password baru Anda</Typography>
          </div>

          {errorState && (
            <Alert severity='error' className='mbe-4'>
              {errorState.message.map((msg, index) => (
                <div key={index}>{msg}</div>
              ))}
            </Alert>
          )}

          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            <Controller
              name='email'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  type='email'
                  label='Email'
                  placeholder='Email Anda'
                  disabled
                  {...(errors.email && { error: true, helperText: errors.email.message })}
                />
              )}
            />

            <div>
              <Typography variant='body2' className='mbe-2'>
                Kode Reset Password (6 digit)
              </Typography>
              <OTPInput
                maxLength={6}
                containerClassName='group flex items-center has-[:disabled]:opacity-30'
                value={otp ?? ''}
                onChange={(value: string) => setOtp(value)}
                render={({ slots }) => (
                  <div className='flex items-center justify-between w-full gap-4'>
                    {slots.slice(0, 6).map((slot, idx) => (
                      <Slot key={idx} {...slot} />
                    ))}
                  </div>
                )}
              />
              {errors.code && (
                <Typography variant='body2' color='error' className='mli-2'>
                  {errors.code.message}
                </Typography>
              )}
            </div>

            <Controller
              name='password'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <div>
                  <CustomTextField
                    {...field}
                    autoFocus
                    fullWidth
                    label='Password Baru'
                    placeholder='············'
                    type={isPasswordShown ? 'text' : 'password'}
                    onChange={e => {
                      field.onChange(e.target.value)
                      errorState && setErrorState(null)
                    }}
                    {...(errors.password && { error: true, helperText: errors.password.message })}
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
                  {watchedPassword && (
                    <div className='mt-2 space-y-1'>
                      <div className='flex items-center gap-2 text-xs'>
                        <i className={`tabler-circle-check text-sm ${passwordValidation.length ? 'text-success' : 'text-textDisabled'}`} />
                        <span className={passwordValidation.length ? 'text-success' : 'text-textDisabled'}>
                          Minimal 8 karakter
                        </span>
                      </div>
                      <div className='flex items-center gap-2 text-xs'>
                        <i className={`tabler-circle-check text-sm ${passwordValidation.lowercase ? 'text-success' : 'text-textDisabled'}`} />
                        <span className={passwordValidation.lowercase ? 'text-success' : 'text-textDisabled'}>
                          Huruf kecil (a-z)
                        </span>
                      </div>
                      <div className='flex items-center gap-2 text-xs'>
                        <i className={`tabler-circle-check text-sm ${passwordValidation.uppercase ? 'text-success' : 'text-textDisabled'}`} />
                        <span className={passwordValidation.uppercase ? 'text-success' : 'text-textDisabled'}>
                          Huruf besar (A-Z)
                        </span>
                      </div>
                      <div className='flex items-center gap-2 text-xs'>
                        <i className={`tabler-circle-check text-sm ${passwordValidation.number ? 'text-success' : 'text-textDisabled'}`} />
                        <span className={passwordValidation.number ? 'text-success' : 'text-textDisabled'}>
                          Angka (0-9)
                        </span>
                      </div>
                      <div className='flex items-center gap-2 text-xs'>
                        <i className={`tabler-circle-check text-sm ${passwordValidation.symbol ? 'text-success' : 'text-textDisabled'}`} />
                        <span className={passwordValidation.symbol ? 'text-success' : 'text-textDisabled'}>
                          Simbol (@$!%*?&)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            />

            <Controller
              name='password_confirmation'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Konfirmasi Password'
                  placeholder='············'
                  type={isConfirmPasswordShown ? 'text' : 'password'}
                  onChange={e => {
                    field.onChange(e.target.value)
                    errorState && setErrorState(null)
                  }}
                  {...(errors.password_confirmation && { error: true, helperText: errors.password_confirmation.message })}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={handleClickShowConfirmPassword}
                            onMouseDown={e => e.preventDefault()}
                          >
                            <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              )}
            />

            <Button 
              fullWidth 
              variant='contained' 
              type='submit'
              disabled={isLoading || !otp || otp.length !== 6}
            >
              {isLoading ? 'Mereset Password...' : 'Set Password Baru'}
            </Button>

            <Typography className='flex justify-center items-center' color='primary.main'>
              <Link
                href='/login'
                className='flex items-center gap-1.5'
              >
                <DirectionalIcon
                  ltrIconClass='tabler-chevron-left'
                  rtlIconClass='tabler-chevron-right'
                  className='text-xl'
                />
                <span>Kembali ke Login</span>
              </Link>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  )
}

export default ResetPasswordV1
