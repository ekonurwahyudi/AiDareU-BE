'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import useScrollTrigger from '@mui/material/useScrollTrigger'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import FrontMenu from './FrontMenu'
import CustomIconButton from '@core/components/mui/IconButton'

// Util Imports
import { frontLayoutClasses } from '@layouts/utils/layoutClasses'

// Styles Imports
import styles from './styles.module.css'

const Header = ({ mode }: { mode: Mode }) => {
  // States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  // Hooks
  const isBelowLgScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))

  // Detect window scroll
  const trigger = useScrollTrigger({
    threshold: 0,
    disableHysteresis: true
  })

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      setIsAuthenticated(!!(authToken && userData))
    }

    // Run on mount
    checkAuth()
  }, [])

  return (
    <header className={classnames(frontLayoutClasses.header, styles.header)}>
      <div className={classnames(frontLayoutClasses.navbar, styles.navbar, { [styles.headerScrolled]: trigger })}>
        <div className={classnames(frontLayoutClasses.navbarContent, styles.navbarContent)}>
          {isBelowLgScreen ? (
            <div className='flex items-center gap-2 sm:gap-4'>
              <IconButton onClick={() => setIsDrawerOpen(true)} className='-mis-2'>
                <i className='tabler-menu-2 text-textPrimary' />
              </IconButton>
              <Link href='/front-pages/landing-page'>
                <Logo />
              </Link>
              <FrontMenu mode={mode} isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} />
            </div>
          ) : (
            <div className='flex items-center gap-10'>
              <Link href='/front-pages/landing-page'>
                <Logo />
              </Link>
              <FrontMenu mode={mode} isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} />
            </div>
          )}
          <div className='flex items-center gap-2 sm:gap-4'>
            <ModeDropdown />
            {(
              isAuthenticated ? (
                <Button
                  component={Link}
                  variant='contained'
                  href='/dashboards/ecommerce'
                  startIcon={<i className='tabler-dashboard text-base sm:text-xl' />}
                  className='whitespace-nowrap text-sm sm:text-base px-3 sm:px-4'
                  size='small'
                >
                  <span className='hidden sm:inline'>Dashboard</span>
                  <span className='sm:hidden'>Admin</span>
                </Button>
              ) : (
                <Button
                  component={Link}
                  variant='contained'
                  href='/login'
                  startIcon={<i className='tabler-login text-base sm:text-xl' />}
                  className='whitespace-nowrap text-sm sm:text-base px-3 sm:px-4'
                  size='small'
                >
                  Masuk
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
