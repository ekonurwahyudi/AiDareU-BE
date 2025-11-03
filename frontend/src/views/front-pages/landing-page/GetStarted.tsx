// Next Imports
import Link from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'

// Hooks Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

const GetStarted = ({ mode }: { mode: SystemMode }) => {
  // Vars
  const getStartedImageLight = '/images/front-pages/landing-page/get-started-bg-light.png'
  const getStartedImageDark = '/images/front-pages/landing-page/get-started-bg-dark.png'

  // Hooks
  const getStartedImage = useImageVariant(mode, getStartedImageLight, getStartedImageDark)

  return (
    <section className='relative overflow-hidden bg-backgroundPaper py-16 md:py-20'>
      {getStartedImage && (
        <img
          src={getStartedImage}
          alt='background-image'
          className='absolute inset-0 w-full h-full object-cover -z-1 pointer-events-none'
        />
      )}
      <div
        className={classnames(
          'flex items-center flex-wrap justify-center lg:justify-between gap-y-10 gap-x-8 lg:gap-x-16',
          frontCommonStyles.layoutSpacing
        )}
      >
        <div className='flex flex-col items-center lg:items-start gap-y-6 z-[1] max-w-full lg:max-w-[45%] order-1'>
          <div className='flex flex-col gap-3 items-center lg:items-start'>
            <Typography
              variant='h4'
              color='primary.main'
              className='font-extrabold text-[1.75rem] sm:text-[2rem] lg:text-[2.5rem] text-center lg:text-start leading-tight'
            >
              Saatnya Bikin Toko Onlinemu!
            </Typography>
            <Typography
              variant='h6'
              color='text.secondary'
              className='text-center lg:text-start font-medium text-base sm:text-lg'
            >
              Tanpa coding, tanpa ribet. Website profesional siap dalam 5 menit. 🚀
            </Typography>
            <div className='flex flex-col sm:flex-row gap-3 items-center text-sm text-gray-600 dark:text-gray-400'>
              <div className='flex items-center gap-2'>
                <i className='tabler-check text-green-500 text-lg' />
                <span>Setup Cepat</span>
              </div>
              <div className='flex items-center gap-2'>
                <i className='tabler-check text-green-500 text-lg' />
                <span>Domain Gratis</span>
              </div>
              <div className='flex items-center gap-2'>
                <i className='tabler-check text-green-500 text-lg' />
                <span>AI Mentor</span>
              </div>
            </div>
          </div>
          <div className='flex flex-col gap-4 items-center lg:items-start w-full lg:w-auto'>
            <Button
              component={Link}
              href='/registrasi'
              variant='contained'
              size='large'
              className='pli-8 plb-3.5 text-base font-bold shadow-xl hover:shadow-2xl transition-shadow bg-gradient-to-r from-primary-500 to-primary-700 whitespace-nowrap'
              startIcon={<i className='tabler-rocket' />}
            >
              Daftar Gratis!
            </Button>
            <div className='flex items-center gap-2.5'>
              <div className='flex -space-x-2'>
                <img
                  src='/images/avatars/1.png'
                  alt='User 1'
                  className='w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover'
                />
                <img
                  src='/images/avatars/2.png'
                  alt='User 2'
                  className='w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover'
                />
                <img
                  src='/images/avatars/3.png'
                  alt='User 3'
                  className='w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover'
                />
                <img
                  src='/images/avatars/4.png'
                  alt='User 4'
                  className='w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover'
                />
              </div>
              <span className='font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-300'>500+ UMKM bergabung</span>
            </div>
          </div>
        </div>
        <div className='flex justify-center lg:justify-end items-center pbs-4 lg:pbs-0 z-[1] max-w-full lg:max-w-[50%] order-2'>
          <div className='relative w-full max-w-[450px] lg:max-w-[550px]'>
            <div className='absolute -top-4 -left-4 w-20 h-20 bg-primary-500/20 rounded-full blur-2xl' />
            <div className='absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl' />
            <img
              src='/images/front-pages/landing-page/crm-dashboard.png'
              alt='dashboard-image'
              className='relative w-full h-auto rounded-2xl shadow-2xl border-4 border-white dark:border-gray-700'
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default GetStarted
