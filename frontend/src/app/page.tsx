// MUI Imports
import Button from '@mui/material/Button'

// Type Imports
import type { SystemMode } from '@core/types'

// Context Imports
import { IntersectionProvider } from '@/contexts/intersectionContext'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import FrontLayout from '@components/layout/front-pages'
import ScrollToTop from '@core/components/scroll-to-top'
import LandingPageWrapper from '@views/front-pages/landing-page'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

const RootPage = async () => {
  // Vars
  const mode = await getServerMode()

  return (
    <Providers direction='ltr'>
      <BlankLayout systemMode={mode}>
        <IntersectionProvider>
          <FrontLayout>
            <LandingPageWrapper mode={mode} />
            <ScrollToTop className='mui-fixed'>
              <Button
                variant='contained'
                className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'
              >
                <i className='tabler-arrow-up' />
              </Button>
            </ScrollToTop>
          </FrontLayout>
        </IntersectionProvider>
      </BlankLayout>
    </Providers>
  )
}

export default RootPage