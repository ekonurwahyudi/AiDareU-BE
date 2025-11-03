'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import HeroSection from './HeroSection'
// import TrustedBy from './TrustedBy'
import UsefulFeature from './UsefulFeature'
import CustomerReviews from './CustomerReviews'
import ProductStat from './ProductStat'
import Faqs from './Faqs'
import GetStarted from './GetStarted'
import { useSettings } from '@core/hooks/useSettings'

const LandingPageWrapper = ({ mode }: { mode: SystemMode }) => {
  // Hooks
  const { updatePageSettings } = useSettings()

  // For Page specific settings
  useEffect(() => {
    return updatePageSettings({
      skin: 'default'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='bg-backgroundPaper'>
      <HeroSection mode={mode} />
      {/* <TrustedBy /> */}
      <UsefulFeature />
      <ProductStat />
      <CustomerReviews />
      <Faqs />
      <GetStarted mode={mode} />
    </div>
  )
}

export default LandingPageWrapper
