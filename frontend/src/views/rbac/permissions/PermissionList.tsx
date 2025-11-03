'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import { useRBAC } from '@/contexts/rbacContext'

// Types
import type { Permission } from '@/types/rbac'

const PermissionList = () => {
  // States
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedModule, setExpandedModule] = useState<string | false>(false)

  // Hooks
  const { hasPermission } = useRBAC()

  // Load permissions
  useEffect(() => {
    loadPermissions()
  }, [])

  // Filter permissions based on search
  const filteredPermissions = permissions.filter(permission =>
    permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const loadPermissions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/rbac/permissions', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setPermissions(data.data)
      } else {
        toast.error('Failed to load permissions')
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
      toast.error('Error loading permissions')
    } finally {
      setIsLoading(false)
    }
  }

  // Group permissions by module
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    const module = permission.module
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'success'
      case 'read':
        return 'info'
      case 'update':
        return 'warning'
      case 'delete':
        return 'error'
      case 'manage':
        return 'primary'
      default:
        return 'default'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return 'tabler-plus'
      case 'read':
        return 'tabler-eye'
      case 'update':
        return 'tabler-edit'
      case 'delete':
        return 'tabler-trash'
      case 'manage':
        return 'tabler-settings'
      case 'assign':
        return 'tabler-user-cog'
      default:
        return 'tabler-key'
    }
  }

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'users':
        return 'tabler-users'
      case 'roles':
        return 'tabler-shield'
      case 'permissions':
        return 'tabler-key'
      case 'stores':
        return 'tabler-store'
      case 'products':
        return 'tabler-package'
      case 'orders':
        return 'tabler-shopping-cart'
      case 'analytics':
        return 'tabler-chart-line'
      case 'settings':
        return 'tabler-settings'
      case 'content':
        return 'tabler-notebook'
      default:
        return 'tabler-folder'
    }
  }

  const handleModuleChange = (module: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedModule(isExpanded ? module : false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Permission Management"
        subheader="View all system permissions organized by module"
      />
      
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <CustomTextField
            fullWidth
            placeholder="Search permissions by name, module, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <i className="tabler-search text-xl" />
              }
            }}
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <Typography variant="h4" color="primary">
              {permissions.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Permissions
            </Typography>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <Typography variant="h4" color="success.main">
              {Object.keys(groupedPermissions).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Modules
            </Typography>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <Typography variant="h4" color="secondary.main">
              {permissions.filter(p => p.is_system).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              System Permissions
            </Typography>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <Typography variant="h4" color="warning.main">
              {filteredPermissions.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Filtered Results
            </Typography>
          </div>
        </div>

        {/* Permissions by Module */}
        <div className="space-y-2">
          {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
            <Accordion 
              key={module}
              expanded={expandedModule === module}
              onChange={handleModuleChange(module)}
            >
              <AccordionSummary expandIcon={<i className="tabler-chevron-down" />}>
                <div className="flex items-center gap-3 w-full">
                  <i className={`${getModuleIcon(module)} text-xl text-primary`} />
                  <div className="flex-1">
                    <Typography variant="h6" className="capitalize">
                      {module.replace('_', ' ')} Module
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {modulePermissions.length} permissions
                    </Typography>
                  </div>
                  <Chip 
                    label={modulePermissions.length}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </div>
              </AccordionSummary>
              
              <AccordionDetails>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modulePermissions.map((permission) => (
                    <div key={permission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <i className={`${getActionIcon(permission.action)} text-lg text-${getActionColor(permission.action)}`} />
                          <Typography variant="subtitle2" className="font-medium">
                            {permission.display_name}
                          </Typography>
                        </div>
                        <Chip
                          label={permission.action}
                          color={getActionColor(permission.action) as any}
                          size="small"
                          variant="outlined"
                        />
                      </div>
                      
                      <Typography variant="body2" color="textSecondary" className="mb-2">
                        {permission.description || 'No description available'}
                      </Typography>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          {permission.name}
                        </code>
                        {permission.is_system && (
                          <Chip 
                            label="System"
                            size="small"
                            color="warning"
                            variant="filled"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>

        {Object.keys(groupedPermissions).length === 0 && (
          <div className="text-center py-8">
            <i className="tabler-key text-6xl text-gray-300 mb-4" />
            <Typography variant="h6" color="textSecondary">
              {searchTerm ? 'No permissions found matching your search' : 'No permissions found'}
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PermissionList