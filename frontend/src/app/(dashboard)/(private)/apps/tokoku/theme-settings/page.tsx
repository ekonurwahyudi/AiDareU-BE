// React Imports
import type { ReactElement } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// Component Imports
import ThemeSettings from '@/views/apps/tokoku/theme-settings'

const GeneralTab = dynamic(() => import('@/views/apps/tokoku/theme-settings/general'))
const SlideTab = dynamic(() => import('@/views/apps/tokoku/theme-settings/slide'))
const FaqTab = dynamic(() => import('@/views/apps/tokoku/theme-settings/faq'))
const TestimoniTab = dynamic(() => import('@/views/apps/tokoku/theme-settings/testimoni'))
const SeoTab = dynamic(() => import('@/views/apps/tokoku/theme-settings/seo'))

// Vars
const tabContentList = (): { [key: string]: ReactElement } => ({
  general: <GeneralTab />,
  slide: <SlideTab />,
  faq: <FaqTab />,
  testimoni: <TestimoniTab />,
  seo: <SeoTab />
})

const ThemeSettingsPage = () => {
  return <ThemeSettings tabContentList={tabContentList()} />
}

export default ThemeSettingsPage
