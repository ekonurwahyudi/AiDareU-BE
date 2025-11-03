'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Hooks Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Util Imports
import { frontLayoutClasses } from '@layouts/utils/layoutClasses'

// Styles Imports
import styles from './styles.module.css'
import frontCommonStyles from '@views/front-pages/styles.module.css'

const Footer = ({ mode }: { mode: Mode }) => {
  // Vars
  const footerImageLight = '/images/front-pages/footer-bg-light.png'
  const footerImageDark = '/images/front-pages/footer-bg-dark.png'

  // Hooks
  const dashboardImage = useImageVariant(mode, footerImageLight, footerImageDark)

  return (
    <footer className={frontLayoutClasses.footer}>
      <div className='bg-[#211B2C]'>
        <div
          className={classnames(
            'flex flex-wrap items-center justify-center sm:justify-between gap-4 plb-6',
            frontCommonStyles.layoutSpacing
          )}
        >
          <Typography className='text-white' variant='body2'>
            <span>{`Copyright © ${new Date().getFullYear()}, Made with `}</span>
            <span>{`❤️`}</span>
            <span>{` by `}</span>
            <Link href='https://aidareu.com/' target='_blank' className='font-medium text-white'>
              AiDareU
            </Link>
          </Typography>
          <div className='flex gap-1.5 items-center'>
            <IconButton component={Link} size='small' href='https://www.instagram.com/aidareu/' target='_blank'>
              <i className='tabler-brand-instagram-filled text-white text-lg' />
            </IconButton>
            <IconButton component={Link} size='small' href='#' target='_blank'>
              <i className='tabler-brand-twitter-filled text-white text-lg' />
            </IconButton>
            <IconButton component={Link} size='small' href='#' target='_blank'>
              <i className='tabler-brand-tiktok-filled text-white text-lg' />
            </IconButton>
            <IconButton
              component={Link}
              size='small'
              href='#'
              target='_blank'
            >
              <i className='tabler-brand-youtube-filled text-white text-lg' />
            </IconButton>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
