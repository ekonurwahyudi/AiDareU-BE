'use client'

// React Imports
import { useState } from 'react'

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
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// Component Imports
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { useRBAC } from '@/contexts/rbacContext'

// Types
import type { AssignRoleForm, User } from '@/types/rbac'

interface AssignRoleDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: User
  storeId?: string
}

const AssignRoleDialog = ({ open, onClose, onSuccess, user, storeId }: AssignRoleDialogProps) => {
  // States
  const [isLoading, setIsLoading] = useState(false)

  // Hooks
  const { roles } = useRBAC()

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<AssignRoleForm>({
    defaultValues: {
      user_id: user.id,
      role_ids: user.roles.map(role => role.id),
      store_id: storeId
    }
  })

  const selectedRoleIds = watch('role_ids')

  // Filter roles based on context
  const availableRoles = roles.filter(role => {
    // If assigning roles for specific store, don't show superadmin
    if (storeId && role.name === 'superadmin') {
      return false
    }
    
    // Don't allow changing superadmin role for non-superadmin users
    const isSuperadmin = user.roles.some(r => r.name === 'superadmin')
    if (!isSuperadmin && role.name === 'superadmin') {
      return false
    }
    
    return true
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: AssignRoleForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/rbac/assign-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Roles assigned successfully')
        onSuccess()
        handleClose()
      } else {
        if (result.errors) {
          Object.values(result.errors).flat().forEach((error: any) => {
            toast.error(error)
          })
        } else {
          toast.error(result.message || 'Failed to assign roles')
        }
      }
    } catch (error) {
      console.error('Error assigning roles:', error)
      toast.error('Error assigning roles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = (roleId: string, checked: boolean) => {
    const currentRoles = selectedRoleIds || []
    
    if (checked) {
      return [...currentRoles, roleId]
    } else {
      return currentRoles.filter(id => id !== roleId)
    }
  }

  const getRoleHierarchyWarning = (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (!role) return null

    // Check for conflicting roles based on hierarchy
    const selectedRoles = roles.filter(r => selectedRoleIds?.includes(r.id))
    
    if (role.name === 'owner' && selectedRoles.some(r => r.name === 'admin_toko')) {
      return 'Owner role includes Admin Toko permissions'
    }
    
    return null
  }

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogCloseButton onClick={handleClose} disabled={isLoading}>
        <i className="tabler-x" />
      </DialogCloseButton>
      
      <DialogTitle>Assign Roles</DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <div className="flex flex-col gap-4">
            {/* User Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Avatar
                src={user.avatar}
                alt={user.nama_lengkap}
                sx={{ width: 48, height: 48 }}
              >
                {user.nama_lengkap[0]?.toUpperCase()}
              </Avatar>
              <div>
                <Typography variant="h6">{user.nama_lengkap}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {user.email}
                </Typography>
              </div>
            </div>

            <Divider />
            
            <Typography variant="h6" className="mb-2">
              Available Roles
              {storeId && (
                <Typography variant="caption" display="block" color="textSecondary">
                  Roles for store context
                </Typography>
              )}
            </Typography>

            <Controller
              name="role_ids"
              control={control}
              rules={{ required: 'At least one role must be selected' }}
              render={({ field }) => (
                <FormControl error={!!errors.role_ids}>
                  <div className="flex flex-col gap-3">
                    {availableRoles.map((role) => {
                      const isCurrentlyAssigned = user.roles.some(r => r.id === role.id)
                      const warning = getRoleHierarchyWarning(role.id)
                      
                      return (
                        <div key={role.id} className="border rounded-lg p-3">
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={field.value?.includes(role.id) || false}
                                onChange={(e) => {
                                  const newValue = handleRoleChange(role.id, e.target.checked)
                                  field.onChange(newValue)
                                }}
                              />
                            }
                            label={
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Typography variant="body1" className="font-medium">
                                    {role.display_name}
                                  </Typography>
                                  {isCurrentlyAssigned && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      Currently Assigned
                                    </span>
                                  )}
                                </div>
                                <Typography variant="body2" color="textSecondary" className="mt-1">
                                  {role.description}
                                </Typography>
                                {warning && (
                                  <Typography variant="caption" color="warning.main" className="mt-1 block">
                                    ⚠️ {warning}
                                  </Typography>
                                )}
                              </div>
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                  {errors.role_ids && (
                    <FormHelperText>{errors.role_ids.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            {/* Role Hierarchy Info */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <Typography variant="caption" className="font-medium block mb-1">
                Role Hierarchy:
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Superadmin → Owner → Admin Toko
              </Typography>
              <br />
              <Typography variant="caption" color="textSecondary">
                Higher-level roles inherit permissions from lower-level roles.
              </Typography>
            </div>
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
            {isLoading ? 'Assigning...' : 'Assign Roles'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AssignRoleDialog