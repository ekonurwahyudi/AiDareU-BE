// Type Imports
import type { ChildrenType } from '@core/types'

const GuestOnlyRoute = ({ children }: ChildrenType) => {
  // Authentication check is now handled client-side via localStorage
  return <>{children}</>
}

export default GuestOnlyRoute
