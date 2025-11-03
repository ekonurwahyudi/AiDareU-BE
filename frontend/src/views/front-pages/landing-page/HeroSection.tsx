// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useColorScheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Styles Imports
import styles from './styles.module.css'
import frontCommonStyles from '@views/front-pages/styles.module.css'

const HeroSection = ({ mode }: { mode: SystemMode }) => {
  // States
  const [transform, setTransform] = useState('')

  // Vars
  const dashboardImageLight = '/images/front-pages/landing-page/hero-dashboard-light.png'
  const dashboardImageDark = '/images/front-pages/landing-page/hero-dashboard-dark.png'
  const elementsImageLight = '/images/front-pages/landing-page/hero-elements-light.png'
  const elementsImageDark = '/images/front-pages/landing-page/hero-elements-dark.png'
  const heroSectionBgLight = '/images/front-pages/landing-page/hero-bg-light.png'
  const heroSectionBgDark = '/images/front-pages/landing-page/hero-bg-dark.png'

  // Hooks
  const { mode: muiMode } = useColorScheme()
  const dashboardImage = useImageVariant(mode, dashboardImageLight, dashboardImageDark)
  const elementsImage = useImageVariant(mode, elementsImageLight, elementsImageDark)
  const heroSectionBg = useImageVariant(mode, heroSectionBgLight, heroSectionBgDark)

  const _mode = (muiMode === 'system' ? mode : muiMode) || mode
  const isAboveLgScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'))

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleMouseMove = (event: MouseEvent) => {
        const rotateX = (window.innerHeight - 2 * event.clientY) / 100
        const rotateY = (window.innerWidth - 2 * event.clientX) / 100

        setTransform(
          `perspective(1200px) rotateX(${rotateX < -40 ? -20 : rotateX}deg) rotateY(${rotateY}deg) scale3d(1,1,1)`
        )
      }

      window.addEventListener('mousemove', handleMouseMove)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [])

  return (
    <section id='home' className='overflow-hidden pbs-[75px] -mbs-[75px] relative'>
      <img
        // src={heroSectionBg}
        alt='hero-bg'
        className={classnames('bs-[95%] sm:bs-[85%] md:bs-[80%]', styles.heroSectionBg, {
          [styles.bgLight]: _mode === 'light',
          [styles.bgDark]: _mode === 'dark'
        })}
      />
      <div className={classnames('pbs-[88px] overflow-hidden', frontCommonStyles.layoutSpacing)}>
        <div className='md:max-is-[750px] mbs-0 mli-auto text-center relative'>
          <Typography
            className={classnames('font-extrabold sm:text-[52px] text-4xl mbe-4 leading-tight', styles.heroText)}
          >
            Platform Website Profesional untuk UMKM Indonesia
          </Typography>
          <Typography className='font-medium text-base sm:text-lg mbe-3' color='text.primary'>
            Jangkau Pelanggan Lebih Luas dengan Website Toko Online Sendiri, Kami siap membantu brand kamu tumbuh di era transformasi digital.
          </Typography>
          <Typography className='font-medium text-sm sm:text-base mbe-4' color='text.primary'>
            ✓ Tanpa Coding  ✓ 100% Gratis  ✓ Siap dalam 5 Menit
          </Typography>
          {/* <div className='flex gap-2 items-center justify-center'>
              <Typography className='font-medium text-sm sm:text-base mbe-4' color='text.primary'>
                🔥 Domain Gratis untuk 20 Pendaftar Pertama!
              </Typography>
            </div> */}
        </div>
        <div className='flex items-center justify-center gap-4 relative flex-wrap'>
            <Button
              component={Link}
              size='large'
              href='/registrasi'
              variant='contained'
              color='primary'
              className='pli-10 plb-4 text-lg font-bold'
              startIcon={<i className='tabler-rocket' />}
            >
              Buat Website Gratis
            </Button>
          </div>
      </div>
      <div
        className={classnames('relative text-center', frontCommonStyles.layoutSpacing)}
        style={{ transform: isAboveLgScreen ? transform : 'none' }}
      >
        <Link href='/' target='_blank' className='block relative'>
          <img src={dashboardImage} alt='dashboard-image' className={classnames('mli-auto', styles.heroSecDashboard)} />
          <div className={classnames('absolute', styles.heroSectionElements)}>
            <img src={elementsImage} alt='dashboard-elements' />
          </div>
        </Link>
      </div>
    </section>
  )
}

export default HeroSection
