'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Grid from '@mui/material/Grid'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Types
import type { Role, Permission } from '@/types/rbac'

interface RolePermissionsDialogProps {
  open: boolean
  role: Role | null
  onClose: () => void
}

const RolePermissionsDialog = ({ open, role, onClose }: RolePermissionsDialogProps) => {
  // States
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedModule, setExpandedModule] = useState<string | false>(false)

  // Filter permissions based on search
  const filteredPermissions = role?.permissions?.filter(permission =>
    permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

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
      case 'create': return 'success'
      case 'read': return 'info'
      case 'update': return 'warning'
      case 'delete': return 'error'
      case 'manage': return 'primary'
      default: return 'default'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return 'tabler-plus'
      case 'read': return 'tabler-eye'
      case 'update': return 'tabler-edit'
      case 'delete': return 'tabler-trash'
      case 'manage': return 'tabler-settings'
      case 'assign': return 'tabler-user-cog'
      default: return 'tabler-key'
    }
  }

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'users': return 'tabler-users'
      case 'roles': return 'tabler-shield'
      case 'permissions': return 'tabler-key'
      case 'stores': return 'tabler-store'
      case 'products': return 'tabler-package'
      case 'orders': return 'tabler-shopping-cart'
      case 'analytics': return 'tabler-chart-line'
      case 'settings': return 'tabler-settings'
      case 'content': return 'tabler-notebook'
      default: return 'tabler-folder'
    }
  }

  const handleModuleChange = (module: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedModule(isExpanded ? module : false)
  }

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm('')
      setExpandedModule(false)
    }
  }, [open])

  if (!role) return null

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <div className="flex items-center gap-3">
          <i className="tabler-shield text-2xl text-primary" />
          <div className="flex-1">
            <Typography variant="h5">
              {role.display_name} Permissions
            </Typography>
            <Typography variant="body2" color="textSecondary">
              View all permissions assigned to this role
            </Typography>
          </div>
          <div className="text-right">
            <Chip 
              label={role.is_system ? 'System Role' : 'Custom Role'}
              color={role.is_system ? 'warning' : 'primary'}
              variant="filled"
            />
          </div>
        </div>
      </DialogTitle>

      <DialogContent className="space-y-6">
        {/* Role Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                Role Name
              </Typography>
              <Typography variant="body1" className="font-medium">
                {role.display_name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                System Name
              </Typography>
              <Typography variant="body1" className="font-mono text-sm">
                {role.name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                Total Permissions
              </Typography>
              <Typography variant="body1" className="font-medium">
                {role.permissions?.length || 0}
              </Typography>
            </Grid>
            {role.description && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {role.description}
                </Typography>
              </Grid>
            )}
          </Grid>
        </div>

        {/* Search */}
        <div>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <Typography variant="h5" color="primary">
              {role.permissions?.length || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Permissions
            </Typography>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <Typography variant="h5" color="success.main">
              {Object.keys(groupedPermissions).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Modules
            </Typography>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <Typography variant="h5" color="secondary.main">
              {role.permissions?.filter(p => p.is_system).length || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              System Permissions
            </Typography>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <Typography variant="h5" color="warning.main">
              {filteredPermissions.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Filtered Results
            </Typography>
          </div>
        </div>

        <Divider />

        {/* Permissions by Module */}
        {Object.keys(groupedPermissions).length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
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
                            <i className={`${getActionIcon(permission.action)} text-lg`} 
                               style={{ color: `var(--mui-palette-${getActionColor(permission.action)}-main)` }} />
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
                              sx={{ height: 16, fontSize: '0.6rem' }}
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
        ) : (
          <div className="text-center py-8">
            <i className="tabler-key text-6xl text-gray-300 mb-4" />
            <Typography variant="h6" color="textSecondary">
              {searchTerm ? 'No permissions found matching your search' : 'No permissions assigned to this role'}
            </Typography>
            {searchTerm && (
              <Button 
                variant="outlined" 
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </DialogContent>

      <DialogActions className="px-6 pb-6">
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RolePermissionsDialog