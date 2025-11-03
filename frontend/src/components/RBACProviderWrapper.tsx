'use client'

// Type Imports
import type { ChildrenType } from '@core/types'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

const RBACProviderWrapper = ({ children }: ChildrenType) => {
  return <RBACProvider>{children}</RBACProvider>
}

export default RBACProviderWrapper
