'use client'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// Component Imports
import Link from '@components/Link'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()

  return (
    <div
      className={classnames(
        verticalLayoutClasses.footerContent,
        'flex items-center justify-center sm:justify-between flex-wrap gap-4 !pli-6 !plb-4'
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
        <IconButton component={Link} size='small' href='#' target='_blank'>
          <i className='tabler-brand-youtube-filled text-white text-lg' />
        </IconButton>
      </div>
    </div>
  )
}

export default FooterContent
