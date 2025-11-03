'use client'

// React Imports
import { ReactNode } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: string[]
  requiredPermissions?: string[]
  fallback?: ReactNode
  redirectTo?: string
}

const ProtectedRoute = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallback,
  redirectTo = '/dashboard'
}: ProtectedRouteProps) => {
  const { user, hasRole, hasPermission, isLoading } = useRBAC()

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <Typography variant="h6" className="mt-4">Loading...</Typography>
        </div>
      </div>
    )
  }

  // User not authenticated
  if (!user) {
    if (fallback) return <>{fallback}</>
    
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-8">
            <i className="tabler-lock text-6xl text-error mb-4" />
            <Typography variant="h5" className="mb-2">
              Authentication Required
            </Typography>
            <Typography variant="body1" className="mb-6 text-textSecondary">
              You need to be logged in to access this page.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check role permissions
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role))
    if (!hasRequiredRole) {
      if (fallback) return <>{fallback}</>
      
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-md w-full">
            <CardContent className="text-center p-8">
              <i className="tabler-shield-x text-6xl text-warning mb-4" />
              <Typography variant="h5" className="mb-2">
                Access Denied
              </Typography>
              <Typography variant="body1" className="mb-6 text-textSecondary">
                You don't have the required role to access this page.
                <br />
                <small>Required roles: {requiredRoles.join(', ')}</small>
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => window.location.href = redirectTo}
                className="w-full"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // Check specific permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission))
    if (!hasAllPermissions) {
      if (fallback) return <>{fallback}</>
      
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-md w-full">
            <CardContent className="text-center p-8">
              <i className="tabler-ban text-6xl text-error mb-4" />
              <Typography variant="h5" className="mb-2">
                Insufficient Permissions
              </Typography>
              <Typography variant="body1" className="mb-6 text-textSecondary">
                You don't have the required permissions to access this page.
                <br />
                <small>Required permissions: {requiredPermissions.join(', ')}</small>
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => window.location.href = redirectTo}
                className="w-full"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // All checks passed, render children
  return <>{children}</>
}

export default ProtectedRoute