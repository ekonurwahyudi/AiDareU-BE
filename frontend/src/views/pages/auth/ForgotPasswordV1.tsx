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
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { email, object, string, pipe, nonEmpty } from 'valibot'
import type { SubmitHandler } from 'react-hook-form'
import type { InferInput } from 'valibot'
import { toast } from 'react-toastify'

// Component Imports
import DirectionalIcon from '@components/DirectionalIcon'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Styled Component Imports
import AuthIllustrationWrapper from './AuthIllustrationWrapper'

// Form Schema
const schema = object({
  email: pipe(string(), nonEmpty('Email is required'), email('Email format is invalid'))
})

type FormData = InferInput<typeof schema>

const ForgotPasswordV1 = () => {
  // States
  const [isLoading, setIsLoading] = useState(false)
  const [errorState, setErrorState] = useState<{ message: string[] } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Hooks
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {
    setIsLoading(true)
    setErrorState(null)
    setSuccessMessage(null)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: data.email })
      })

      const result = await response.json()

      if (response.ok) {
        setSuccessMessage('Kode reset password telah dikirim ke email Anda. Silakan periksa inbox dan spam folder.')
        toast.success('Kode reset password berhasil dikirim!')
        
        // Redirect to reset password page with email param after 2 seconds
        setTimeout(() => {
          router.push(`/auth/reset-password?email=${encodeURIComponent(data.email)}`)
        }, 2000)
      } else {
        const errorMessage = result.message || 'Terjadi kesalahan saat mengirim kode reset password'
        setErrorState({ message: [errorMessage] })
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Forgot password error:', error)
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
            <Typography variant='h4'>Lupa Password 🔒</Typography>
            <Typography>Masukkan email Anda dan kami akan mengirim kode untuk reset password</Typography>
          </div>
          
          {errorState && (
            <Alert severity='error' className='mbe-4'>
              {errorState.message.map((msg, index) => (
                <div key={index}>{msg}</div>
              ))}
            </Alert>
          )}

          {successMessage && (
            <Alert severity='success' className='mbe-4'>
              {successMessage}
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
                  autoFocus
                  fullWidth
                  type='email'
                  label='Email'
                  placeholder='Masukkan email Anda'
                  onChange={e => {
                    field.onChange(e.target.value)
                    errorState && setErrorState(null)
                  }}
                  {...(errors.email && { error: true, helperText: errors.email.message })}
                />
              )}
            />
            <Button 
              fullWidth 
              variant='contained' 
              type='submit'
              disabled={isLoading}
            >
              {isLoading ? 'Mengirim...' : 'Kirim Kode Reset'}
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

export default ForgotPasswordV1
