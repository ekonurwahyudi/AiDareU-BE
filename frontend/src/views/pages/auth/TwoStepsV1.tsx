'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Third-party Imports
import { OTPInput } from 'input-otp'
import type { SlotProps } from 'input-otp'
import classnames from 'classnames'
import { toast } from 'react-toastify'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'

// Styled Component Imports
import AuthIllustrationWrapper from './AuthIllustrationWrapper'

// Style Imports
import styles from '@/libs/styles/inputOtp.module.css'

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

const TwoStepsV1 = () => {
  // States
  const [otp, setOtp] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Hooks
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get email from URL params or unverified user data
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Check for unverified user data from login attempt
      const unverifiedUser = localStorage.getItem('unverified_user')
      if (unverifiedUser) {
        try {
          const userData = JSON.parse(unverifiedUser)
          if (userData.user?.email) {
            setEmail(userData.user.email)
            // Auto-send verification code when coming from login
            handleResendCode(userData.user.email)
          }
        } catch (error) {
          console.error('Error parsing unverified user data:', error)
        }
      }
    }
  }, [searchParams])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [countdown])

  const handleVerifyCode = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Silakan masukkan kode verifikasi 6 digit')
      return
    }

    setIsLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code: otp
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Verifikasi email berhasil!')
        
        // Check if we have unverified user data from login attempt
        const unverifiedUser = localStorage.getItem('unverified_user')
        console.log('Verification successful, checking unverified user data:', unverifiedUser)
        
        if (unverifiedUser) {
          try {
            const userData = JSON.parse(unverifiedUser)
            if (userData.email && userData.password) {
              // Clear localStorage first
              localStorage.removeItem('unverified_user')
              
              // Login using the verified credentials with direct API
              const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
              const loginResponse = await fetch(`${backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                  email: userData.email,
                  password: userData.password 
                })
              })
              
              const loginResult = await loginResponse.json()
              console.log('Auto-login response:', { status: loginResponse.status, result: loginResult })
              
              if (loginResponse.ok && !loginResult.requires_verification) {
                // Store auth data and redirect to dashboard
                localStorage.setItem('auth_token', loginResult.token)
                localStorage.setItem('user_data', JSON.stringify(loginResult.user))
                console.log('Redirecting to dashboard with auth data stored')
                window.location.href = '/dashboards/ecommerce'
                return
              } else {
                console.error('Auto-login after verification failed:', loginResult)
                // Since email is now verified, still redirect to dashboard
                console.log('Still redirecting to dashboard despite auto-login failure')
                window.location.href = '/dashboards/ecommerce'
                return
              }
            }
          } catch (error) {
            console.error('Error processing unverified user data:', error)
          }
          
          // Clear localStorage if we reach here
          localStorage.removeItem('unverified_user')
        }
        
        // Redirect to ecommerce dashboard
        console.log('No unverified user data, redirecting to dashboard')
        window.location.href = '/dashboards/ecommerce'
      } else {
        toast.error(result.message || 'Kode verifikasi tidak valid')
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async (emailParam?: string) => {
    if (countdown > 0 && !emailParam) return

    setIsResending(true)
    try {
      const targetEmail = emailParam || email
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: targetEmail })
      })

      const result = await response.json()

      if (response.ok) {
        if (emailParam) {
          // Auto-send dari login
          toast.success('Kode verifikasi telah dikirim ke email Anda')
        } else {
          // Manual resend
          toast.success('Kode verifikasi baru telah dikirim')
        }
        setCountdown(60) // 60 second cooldown
        setOtp(null) // Clear current OTP
      } else {
        toast.error(result.message || 'Gagal mengirim ulang kode')
      }
    } catch (error) {
      console.error('Resend error:', error)
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setIsResending(false)
    }
  }

  const maskEmail = (email: string) => {
    if (!email) return '******'
    const [name, domain] = email.split('@')
    if (!name || !domain) return '******'
    const maskedName = name.length > 2 ? name[0] + '*'.repeat(name.length - 2) + name[name.length - 1] : name
    return `${maskedName}@${domain}`
  }

  return (
    <AuthIllustrationWrapper>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href='/' className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>Verifikasi Email 📧</Typography>
            <Typography>
              Kami telah mengirimkan kode verifikasi ke email Anda. Masukkan kode 6 digit yang diterima di kolom bawah ini.
            </Typography>
            <Typography className='font-medium' color='text.primary'>
              {maskEmail(email)}
            </Typography>
          </div>
          <form noValidate autoComplete='off' onSubmit={e => e.preventDefault()} className='flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
              <Typography>Masukkan kode verifikasi 6 digit</Typography>
              <OTPInput
                onChange={setOtp}
                value={otp ?? ''}
                maxLength={6}
                containerClassName='flex items-center'
                render={({ slots }) => (
                  <div className='flex items-center justify-between w-full gap-4'>
                    {slots.slice(0, 6).map((slot, idx) => (
                      <Slot key={idx} {...slot} />
                    ))}
                  </div>
                )}
              />
            </div>
            <Button 
              fullWidth 
              variant='contained' 
              onClick={handleVerifyCode}
              disabled={isLoading || !otp || otp.length !== 6}
            >
              {isLoading ? 'Memverifikasi...' : 'Verifikasi Akun Saya'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Tidak menerima kode?</Typography>
              <Typography 
                color={countdown > 0 ? 'text.secondary' : 'primary.main'} 
                component='span'
                onClick={countdown > 0 ? undefined : () => handleResendCode()}
                style={{ cursor: countdown > 0 ? 'default' : 'pointer' }}
              >
                {isResending ? 'Mengirim...' : countdown > 0 ? `Kirim Ulang (${countdown}s)` : 'Kirim Ulang'}
              </Typography>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  )
}

export default TwoStepsV1
