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
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { useRBAC } from '@/contexts/rbacContext'

// Types
import type { CreateUserForm, Role } from '@/types/rbac'

interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  storeId?: string
}

const CreateUserDialog = ({ open, onClose, onSuccess, storeId }: CreateUserDialogProps) => {
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
  } = useForm<CreateUserForm>({
    defaultValues: {
      nama_lengkap: '',
      email: '',
      no_hp: '',
      password: '',
      role_ids: [],
      store_id: storeId
    }
  })

  const selectedRoleIds = watch('role_ids')

  // Filter roles based on context
  const availableRoles = roles.filter(role => {
    // If creating user for specific store, don't show superadmin
    if (storeId && role.name === 'superadmin') {
      return false
    }
    return true
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: CreateUserForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/rbac/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('User created successfully')
        onSuccess()
        handleClose()
      } else {
        if (result.errors) {
          Object.values(result.errors).flat().forEach((error: any) => {
            toast.error(error)
          })
        } else {
          toast.error(result.message || 'Failed to create user')
        }
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Error creating user')
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
      
      <DialogTitle>Create New User</DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <div className="flex flex-col gap-4">
            <Controller
              name="nama_lengkap"
              control={control}
              rules={{
                required: 'Full name is required',
                minLength: { value: 2, message: 'Full name must be at least 2 characters' }
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label="Full Name"
                  placeholder="Enter full name"
                  error={!!errors.nama_lengkap}
                  helperText={errors.nama_lengkap?.message}
                />
              )}
            />

            <Controller
              name="email"
              control={control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email format'
                }
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label="Email"
                  placeholder="Enter email address"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />

            <Controller
              name="no_hp"
              control={control}
              rules={{
                required: 'Phone number is required',
                pattern: {
                  value: /^(\+62|62|0)[0-9]{9,13}$/,
                  message: 'Invalid phone number format (e.g., 08123456789)'
                }
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label="Phone Number"
                  placeholder="Enter phone number"
                  error={!!errors.no_hp}
                  helperText={errors.no_hp?.message}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              rules={{
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain lowercase, uppercase, and number'
                }
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              )}
            />

            <Divider className="my-2" />
            
            <Typography variant="h6" className="mb-2">
              Assign Roles
            </Typography>

            <Controller
              name="role_ids"
              control={control}
              rules={{ required: 'At least one role must be selected' }}
              render={({ field }) => (
                <FormControl error={!!errors.role_ids}>
                  <div className="flex flex-col gap-2">
                    {availableRoles.map((role) => (
                      <FormControlLabel
                        key={role.id}
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
                          <div>
                            <Typography variant="body2" className="font-medium">
                              {role.display_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {role.description}
                            </Typography>
                          </div>
                        }
                      />
                    ))}
                  </div>
                  {errors.role_ids && (
                    <FormHelperText>{errors.role_ids.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
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
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default CreateUserDialog