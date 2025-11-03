// Next Imports
import { headers } from 'next/headers'

// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import ToastProvider from '@/components/ToastProvider'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'AiDareU - AI-Powered Website Builder',
  description:
    'AiDareU - AI-Powered Website Builder - Create stunning websites with AI assistance and drag-and-drop functionality.'
}

const RootLayout = async (props: ChildrenType) => {
  const { children } = props

  // Vars
  const headersList = await headers()
  const systemMode = await getSystemMode()

  return (
    <html id='__next' lang='en' dir='ltr' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
