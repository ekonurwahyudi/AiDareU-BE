// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import { CartProvider } from '@/contexts/CartContext'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'AiDareU Store - Premium Products',
  description: 'Discover amazing products at AiDareU Store. Quality items with great prices.'
}

const StoreLayout = async ({ children }: ChildrenType) => {
  // Vars
  const systemMode = await getSystemMode()

  return (
    <Providers direction='ltr'>
      <BlankLayout systemMode={systemMode}>
        <CartProvider>
          {children}
        </CartProvider>
      </BlankLayout>
    </Providers>
  )
}

export default StoreLayout