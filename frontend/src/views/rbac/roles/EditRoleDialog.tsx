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
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import FormGroup from '@mui/material/FormGroup'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Types
import type { Role, Permission } from '@/types/rbac'

interface EditRoleDialogProps {
  open: boolean
  role: Role | null
  permissions: Permission[]
  onClose: () => void
  onSuccess: () => void
}

interface EditRoleFormData {
  name: string
  display_name: string
  description: string
  permissions: number[]
}

const EditRoleDialog = ({ open, role, permissions, onClose, onSuccess }: EditRoleDialogProps) => {
  // States
  const [isLoading, setIsLoading] = useState(false)

  // Form
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EditRoleFormData>({
    defaultValues: {
      name: '',
      display_name: '',
      description: '',
      permissions: []
    }
  })

  const selectedPermissions = watch('permissions')

  // Load role data when dialog opens
  useEffect(() => {
    if (role && open) {
      reset({
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
        permissions: role.permissions?.map(p => p.id) || []
      })
    } else if (!role && open) {
      reset({
        name: '',
        display_name: '',
        description: '',
        permissions: []
      })
    }
  }, [role, open, reset])

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const module = permission.module
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

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

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    const currentPermissions = selectedPermissions || []
    if (checked) {
      setValue('permissions', [...currentPermissions, permissionId])
    } else {
      setValue('permissions', currentPermissions.filter(id => id !== permissionId))
    }
  }

  const handleSelectAllModule = (modulePermissions: Permission[], checked: boolean) => {
    const currentPermissions = selectedPermissions || []
    const moduleIds = modulePermissions.map(p => p.id)
    
    if (checked) {
      const newPermissions = [...new Set([...currentPermissions, ...moduleIds])]
      setValue('permissions', newPermissions)
    } else {
      setValue('permissions', currentPermissions.filter(id => !moduleIds.includes(id)))
    }
  }

  const isModuleSelected = (modulePermissions: Permission[]) => {
    const moduleIds = modulePermissions.map(p => p.id)
    return moduleIds.every(id => selectedPermissions?.includes(id))
  }

  const isModulePartiallySelected = (modulePermissions: Permission[]) => {
    const moduleIds = modulePermissions.map(p => p.id)
    const selectedCount = moduleIds.filter(id => selectedPermissions?.includes(id)).length
    return selectedCount > 0 && selectedCount < moduleIds.length
  }

  const onSubmit = async (data: EditRoleFormData) => {
    try {
      setIsLoading(true)

      const url = role ? `/api/rbac/roles/${role.id}` : '/api/rbac/roles'
      const method = role ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success(role ? 'Role updated successfully' : 'Role created successfully')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save role')
      }
    } catch (error) {
      console.error('Error saving role:', error)
      toast.error('Error saving role')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <div className="flex items-center gap-2">
          <i className="tabler-shield text-2xl text-primary" />
          <div>
            <Typography variant="h5">
              {role ? 'Edit Role' : 'Create New Role'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {role ? 'Update role information and permissions' : 'Create a new role with permissions'}
            </Typography>
          </div>
        </div>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <Typography variant="h6" className="flex items-center gap-2">
              <i className="tabler-info-circle" />
              Basic Information
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="display_name"
                  control={control}
                  rules={{ 
                    required: 'Display name is required',
                    minLength: { value: 2, message: 'Display name must be at least 2 characters' }
                  }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Display Name"
                      placeholder="e.g., Store Manager"
                      error={!!errors.display_name}
                      helperText={errors.display_name?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ 
                    required: 'System name is required',
                    pattern: {
                      value: /^[a-z_]+$/,
                      message: 'System name must contain only lowercase letters and underscores'
                    }
                  }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="System Name"
                      placeholder="e.g., store_manager"
                      error={!!errors.name}
                      helperText={errors.name?.message || 'Used internally by the system'}
                      disabled={role?.is_system}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      placeholder="Describe what this role is responsible for..."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </div>

          <Divider />

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Typography variant="h6" className="flex items-center gap-2">
                <i className="tabler-key" />
                Permissions
              </Typography>
              <Chip 
                label={`${selectedPermissions?.length || 0} of ${permissions.length} selected`}
                color="primary"
                variant="outlined"
              />
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                const isSelected = isModuleSelected(modulePermissions)
                const isPartial = isModulePartiallySelected(modulePermissions)
                
                return (
                  <div key={module} className="border rounded-lg p-4">
                    <FormControl component="fieldset" className="w-full">
                      <div className="flex items-center justify-between mb-3">
                        <FormLabel className="flex items-center gap-2">
                          <i className={`${getModuleIcon(module)} text-xl text-primary`} />
                          <Typography variant="subtitle1" className="font-medium capitalize">
                            {module.replace('_', ' ')} Module
                          </Typography>
                        </FormLabel>
                        
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isSelected}
                              indeterminate={isPartial}
                              onChange={(e) => handleSelectAllModule(modulePermissions, e.target.checked)}
                              color="primary"
                            />
                          }
                          label={isSelected ? 'Deselect All' : 'Select All'}
                        />
                      </div>
                      
                      <FormGroup>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {modulePermissions.map((permission) => (
                            <FormControlLabel
                              key={permission.id}
                              control={
                                <Checkbox
                                  checked={selectedPermissions?.includes(permission.id) || false}
                                  onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                  size="small"
                                />
                              }
                              label={
                                <div className="flex items-center gap-2">
                                  <Typography variant="body2">
                                    {permission.display_name}
                                  </Typography>
                                  <Chip
                                    label={permission.action}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 16, fontSize: '0.6rem' }}
                                  />
                                </div>
                              }
                            />
                          ))}
                        </div>
                      </FormGroup>
                    </FormControl>
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>

        <DialogActions className="px-6 pb-6">
          <Button 
            onClick={handleClose}
            disabled={isLoading}
            color="secondary"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : undefined}
          >
            {isLoading ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default EditRoleDialog