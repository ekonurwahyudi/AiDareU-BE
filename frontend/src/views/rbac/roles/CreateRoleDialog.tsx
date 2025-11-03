'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { useRBAC } from '@/contexts/rbacContext'

// Types
import type { CreateRoleForm, Permission } from '@/types/rbac'

interface CreateRoleDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const CreateRoleDialog = ({ open, onClose, onSuccess }: CreateRoleDialogProps) => {
  // States
  const [isLoading, setIsLoading] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])

  // Hooks
  const { roles } = useRBAC()

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<CreateRoleForm>({
    defaultValues: {
      name: '',
      display_name: '',
      description: '',
      permissions: []
    }
  })

  const selectedPermissions = watch('permissions')

  // Load permissions when dialog opens
  useEffect(() => {
    if (open) {
      loadPermissions()
    }
  }, [open])

  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/rbac/permissions', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setPermissions(data.data)
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: CreateRoleForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/rbac/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Role created successfully')
        onSuccess()
        handleClose()
      } else {
        if (result.errors) {
          Object.values(result.errors).flat().forEach((error: any) => {
            toast.error(error)
          })
        } else {
          toast.error(result.message || 'Failed to create role')
        }
      }
    } catch (error) {
      console.error('Error creating role:', error)
      toast.error('Error creating role')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    const currentPermissions = selectedPermissions || []
    
    if (checked) {
      return [...currentPermissions, permissionId]
    } else {
      return currentPermissions.filter(id => id !== permissionId)
    }
  }

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const module = permission.module
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? handleClose : undefined}
      maxWidth="md"
      fullWidth
    >
      <DialogCloseButton onClick={handleClose} disabled={isLoading}>
        <i className="tabler-x" />
      </DialogCloseButton>
      
      <DialogTitle>Create New Role</DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <div className="flex flex-col gap-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="name"
                control={control}
                rules={{
                  required: 'Role name is required',
                  pattern: {
                    value: /^[a-z_]+$/,
                    message: 'Role name must be lowercase with underscores only'
                  }
                }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Role Name"
                    placeholder="e.g., custom_role"
                    error={!!errors.name}
                    helperText={errors.name?.message || 'Lowercase with underscores only'}
                  />
                )}
              />

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
                    placeholder="e.g., Custom Role"
                    error={!!errors.display_name}
                    helperText={errors.display_name?.message}
                  />
                )}
              />
            </div>

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
                  placeholder="Describe the purpose and scope of this role..."
                />
              )}
            />

            <Divider />
            
            <Typography variant="h6" className="mb-2">
              Assign Permissions
            </Typography>

            {/* Permissions by Module */}
            <Controller
              name="permissions"
              control={control}
              rules={{ required: 'At least one permission must be selected' }}
              render={({ field }) => (
                <FormControl error={!!errors.permissions} fullWidth>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                      <div key={module} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Typography variant="subtitle1" className="font-semibold capitalize">
                            {module.replace('_', ' ')} Module
                          </Typography>
                          <Chip 
                            label={`${modulePermissions.filter(p => field.value?.includes(p.id)).length}/${modulePermissions.length}`}
                            size="small"
                            color={modulePermissions.every(p => field.value?.includes(p.id)) ? 'success' : 'default'}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {modulePermissions.map((permission) => (
                            <FormControlLabel
                              key={permission.id}
                              control={
                                <Checkbox
                                  checked={field.value?.includes(permission.id) || false}
                                  onChange={(e) => {
                                    const newValue = handlePermissionChange(permission.id, e.target.checked)
                                    field.onChange(newValue)
                                  }}
                                />
                              }
                              label={
                                <div>
                                  <Typography variant="body2" className="font-medium">
                                    {permission.display_name}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {permission.description}
                                  </Typography>
                                </div>
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {errors.permissions && (
                    <FormHelperText>{errors.permissions.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            {/* Selection Summary */}
            {selectedPermissions && selectedPermissions.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <Typography variant="caption" className="font-medium block mb-2">
                  Selected Permissions ({selectedPermissions.length}):
                </Typography>
                <div className="flex flex-wrap gap-1">
                  {selectedPermissions.slice(0, 10).map(permId => {
                    const perm = permissions.find(p => p.id === permId)
                    return perm ? (
                      <Chip
                        key={perm.id}
                        label={perm.display_name}
                        size="small"
                        variant="outlined"
                      />
                    ) : null
                  })}
                  {selectedPermissions.length > 10 && (
                    <Chip
                      label={`+${selectedPermissions.length - 10} more`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Role'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default CreateRoleDialog