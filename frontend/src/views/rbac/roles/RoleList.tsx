'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import { useRBAC } from '@/contexts/rbacContext'
import CreateRoleDialog from './CreateRoleDialog'
import EditRoleDialog from './EditRoleDialog'
import RolePermissionsDialog from './RolePermissionsDialog'

// Types
import type { Role, Permission } from '@/types/rbac'

const RoleList = () => {
  // States
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Hooks
  const { hasPermission } = useRBAC()

  // Load roles and permissions
  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [])

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const loadRoles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/rbac/roles', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setRoles(data.data)
      } else {
        toast.error('Failed to load roles')
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Error loading roles')
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleDeleteRole = async () => {
    if (!selectedRole) return

    try {
      const response = await fetch(`/api/rbac/roles/${selectedRole.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast.success('Role deleted successfully')
        setShowDeleteDialog(false)
        setSelectedRole(null)
        loadRoles()
      } else {
        toast.error('Failed to delete role')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error('Error deleting role')
    }
  }

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, role: Role) => {
    setActionMenuAnchor(event.currentTarget)
    setSelectedRole(role)
  }

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null)
    setSelectedRole(null)
  }

  const getRoleChipColor = (roleName: string) => {
    switch (roleName) {
      case 'superadmin':
        return 'error'
      case 'owner':
        return 'primary'
      case 'admin_toko':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'superadmin':
        return 'tabler-crown'
      case 'owner':
        return 'tabler-user-star'
      case 'admin_toko':
        return 'tabler-user-cog'
      default:
        return 'tabler-user'
    }
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
    <>
      <Card>
        <CardHeader
          title="Role Management"
          subheader="Manage system roles and their permissions"
          action={
            hasPermission('roles.create') && (
              <Button
                variant="contained"
                startIcon={<i className="tabler-plus" />}
                onClick={() => setShowCreateDialog(true)}
              >
                Add Role
              </Button>
            )
          }
        />
        
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <CustomTextField
              fullWidth
              placeholder="Search roles by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <i className="tabler-search text-xl" />
                }
              }}
            />
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => (
              <Card key={role.id} variant="outlined" className="hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${getRoleChipColor(role.name)}-light`}>
                        <i className={`${getRoleIcon(role.name)} text-2xl text-${getRoleChipColor(role.name)}`} />
                      </div>
                      <div>
                        <Typography variant="h6" className="font-semibold">
                          {role.display_name}
                        </Typography>
                        <Chip
                          label={role.name}
                          color={getRoleChipColor(role.name) as any}
                          size="small"
                          variant="outlined"
                        />
                      </div>
                    </div>
                    
                    {hasPermission('roles.update') && (
                      <Tooltip title="Actions">
                        <IconButton
                          onClick={(e) => handleActionMenuOpen(e, role)}
                          size="small"
                        >
                          <i className="tabler-dots-vertical" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>

                  <Typography variant="body2" color="textSecondary" className="mb-4">
                    {role.description || 'No description available'}
                  </Typography>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <i className="tabler-key text-primary" />
                      <span>{role.permissions?.length || 0} permissions</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <i className="tabler-shield text-info" />
                      <span>Level {role.level}</span>
                    </div>
                  </div>

                  {role.is_system && (
                    <div className="mt-3 pt-3 border-t">
                      <Chip
                        label="System Role"
                        color="warning"
                        size="small"
                        variant="outlined"
                        icon={<i className="tabler-lock text-sm" />}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRoles.length === 0 && (
            <div className="text-center py-8">
              <i className="tabler-shield text-6xl text-gray-300 mb-4" />
              <Typography variant="h6" color="textSecondary">
                {searchTerm ? 'No roles found matching your search' : 'No roles found'}
              </Typography>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        {hasPermission('permissions.read') && (
          <MenuItem
            onClick={() => {
              setShowPermissionsDialog(true)
              handleActionMenuClose()
            }}
          >
            <i className="tabler-key mr-2" />
            Manage Permissions
          </MenuItem>
        )}
        
        {hasPermission('roles.update') && !selectedRole?.is_system && (
          <MenuItem
            onClick={() => {
              setShowEditDialog(true)
              handleActionMenuClose()
            }}
          >
            <i className="tabler-edit mr-2" />
            Edit Role
          </MenuItem>
        )}
        
        {hasPermission('roles.delete') && 
         !selectedRole?.is_system && 
         selectedRole?.name !== 'superadmin' && (
          <MenuItem
            onClick={() => {
              setShowDeleteDialog(true)
              handleActionMenuClose()
            }}
            className="text-error"
          >
            <i className="tabler-trash mr-2" />
            Delete Role
          </MenuItem>
        )}
      </Menu>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateRoleDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={loadRoles}
        />
      )}

      {showEditDialog && selectedRole && (
        <EditRoleDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSuccess={loadRoles}
          role={selectedRole}
          permissions={permissions}
        />
      )}

      {showPermissionsDialog && selectedRole && (
        <RolePermissionsDialog
          open={showPermissionsDialog}
          onClose={() => setShowPermissionsDialog(false)}
          role={selectedRole}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete role <strong>{selectedRole?.display_name}</strong>? 
            This action cannot be undone and will remove all user assignments to this role.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteRole} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default RoleList