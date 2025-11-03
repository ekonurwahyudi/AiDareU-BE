'use client'

// React Imports
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Types
import type { RBACContextType, User, Store, Permission, Role } from '@/types/rbac'

const RBACContext = createContext<RBACContextType | undefined>(undefined)

interface RBACProviderProps {
  children: ReactNode
}

export const RBACProvider = ({ children }: RBACProviderProps) => {
  // States
  const [user, setUser] = useState<User | null>(null)
  const [currentStore, setCurrentStore] = useState<Store | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize RBAC data
  useEffect(() => {
    initializeRBAC()
  }, [])

  const initializeRBAC = async () => {
    try {
      setIsLoading(true)
      
      // Try to get user data from localStorage first (fallback)
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')
      let userData = null

      if (storedUserData) {
        try {
          userData = JSON.parse(storedUserData)
          console.log('User data loaded from localStorage:', userData)
          console.log('Store from user data:', userData.store)

          // Set user immediately
          setUser(userData)

          // If user has store data directly, set it as current store
          if (userData.store) {
            console.log('Setting current store from user data:', userData.store)
            setCurrentStore(userData.store)
          }
        } catch (error) {
          console.error('Failed to parse stored user data:', error)
        }
      }

      // Try to fetch fresh user data from API to get updated store info
      try {
        const userResponse = await fetch('/api/users/me', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            ...(userData?.uuid && { 'X-User-UUID': userData.uuid })
          }
        })

        if (userResponse.ok) {
          const userApiData = await userResponse.json()
          console.log('User data loaded from /api/users/me:', userApiData)

          // Update user data with fresh data from API
          if (userApiData.data || userApiData.status === 'success') {
            const freshUserData = userApiData.data || userApiData

            // Update user state
            setUser(freshUserData)

            // Update current store with user's actual store
            if (freshUserData.store) {
              console.log('Setting current store from API (user\'s own store):', freshUserData.store)
              setCurrentStore(freshUserData.store)
            }
          }
        } else {
          console.warn('Failed to fetch user data from API:', userResponse.status)
          // Already have store from localStorage, so this is not critical
        }
      } catch (apiError) {
        console.warn('API request failed, using stored data:', apiError)
        // Already have store from localStorage, so this is not critical
      }
      
      // Try to get user permissions (optional)
      try {
        await refreshPermissions()
      } catch (permError) {
        console.warn('Failed to refresh permissions, continuing without them:', permError)
      }
      
      // Try to get available roles (optional)
      try {
        const rolesResponse = await fetch('/api/rbac/roles', {
          credentials: 'include'
        })
        
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json()
          setRoles(rolesData.data)
        }
      } catch (rolesError) {
        console.warn('Failed to fetch roles, continuing without them:', rolesError)
      }
      
    } catch (error) {
      console.error('Failed to initialize RBAC:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshPermissions = async () => {
    try {
      const response = await fetch('/api/rbac/permissions/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.data)
      }
    } catch (error) {
      console.error('Failed to refresh permissions:', error)
    }
  }

  const hasPermission = (permission: string, resource?: string): boolean => {
    if (!user) return false
    
    // Superadmin has all permissions
    if (user.roles.some(role => role.name === 'superadmin')) {
      return true
    }
    
    // Check specific permission
    return permissions.some(p => {
      if (resource) {
        return p.name === permission && p.resource === resource
      }
      return p.name === permission
    })
  }

  const hasRole = (roleName: string): boolean => {
    if (!user) return false
    return user.roles.some(role => role.name === roleName)
  }

  const canAccess = (resource: string, action: string): boolean => {
    if (!user) return false
    
    // Superadmin can access everything
    if (hasRole('superadmin')) {
      return true
    }
    
    // Check specific permission for resource and action
    const permissionName = `${resource}.${action}`
    return hasPermission(permissionName, resource)
  }

  const switchStore = async (storeId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/stores/${storeId}/switch`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentStore(data.data)
        // Refresh permissions for new store context
        await refreshPermissions()
      } else {
        throw new Error('Failed to switch store')
      }
    } catch (error) {
      console.error('Failed to switch store:', error)
      throw error
    }
  }

  const contextValue: RBACContextType = {
    user,
    currentStore,
    permissions,
    roles,
    isLoading,
    hasPermission,
    hasRole,
    canAccess,
    switchStore,
    refreshPermissions
  }

  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  )
}

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext)
  if (!context) {
    throw new Error('useRBAC must be used within RBACProvider')
  }
  return context
}

// HOC for role-based component protection
export const withRole = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string[]
) => {
  return (props: P) => {
    const { user, hasRole } = useRBAC()
    
    if (!user) {
      return <div>Loading...</div>
    }
    
    const hasAccess = allowedRoles.some(role => hasRole(role))
    
    if (!hasAccess) {
      return (
        <div className="text-center p-8">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this resource.</p>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}

// HOC for permission-based component protection
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: string[]
) => {
  return (props: P) => {
    const { user, hasPermission } = useRBAC()
    
    if (!user) {
      return <div>Loading...</div>
    }
    
    const hasAccess = requiredPermissions.every(permission => hasPermission(permission))
    
    if (!hasAccess) {
      return (
        <div className="text-center p-8">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this resource.</p>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}