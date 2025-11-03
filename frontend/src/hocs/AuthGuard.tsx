'use client'

// React Imports
import { useEffect, useState } from 'react'

// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

export default function AuthGuard({ children }: ChildrenType) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check for auth token in localStorage
    const authToken = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    
    console.log('AuthGuard: Checking auth status', { 
      hasToken: !!authToken, 
      hasUserData: !!userData 
    })
    
    setIsAuthenticated(!!(authToken && userData))
  }, [])

  // Show loading while checking auth status
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    )
  }

  return <>{isAuthenticated ? children : <AuthRedirect />}</>
}
