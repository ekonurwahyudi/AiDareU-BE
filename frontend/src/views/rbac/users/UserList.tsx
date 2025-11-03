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
import Avatar from '@mui/material/Avatar'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
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
import CreateUserDialog from './CreateUserDialog'
import EditUserDialog from './EditUserDialog'
import AssignRoleDialog from './AssignRoleDialog'

// Types
import type { User, PaginatedResponse } from '@/types/rbac'

interface UserListProps {
  storeId?: string
}

const UserList = ({ storeId }: UserListProps) => {
  // States
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1
  })

  // Hooks
  const { hasPermission, currentStore } = useRBAC()

  // Load users
  useEffect(() => {
    loadUsers()
  }, [pagination.current_page, storeId])

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.current_page.toString(),
        per_page: pagination.per_page.toString()
      })
      
      if (storeId) {
        params.append('store_id', storeId)
      }

      const response = await fetch(`/api/rbac/users?${params}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data: PaginatedResponse<User> = await response.json()
        setUsers(data.data)
        setPagination({
          current_page: data.current_page,
          per_page: data.per_page,
          total: data.total,
          last_page: data.last_page
        })
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Error loading users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleUserStatus = async (user: User) => {
    try {
      const response = await fetch(`/api/rbac/users/${user.id}/toggle-status`, {
        method: 'PUT',
        credentials: 'include'
      })

      if (response.ok) {
        toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`)
        loadUsers()
      } else {
        toast.error('Failed to update user status')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Error updating user status')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/rbac/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        setShowDeleteDialog(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        toast.error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error deleting user')
    }
  }

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setActionMenuAnchor(event.currentTarget)
    setSelectedUser(user)
  }

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null)
    setSelectedUser(null)
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
          title="User Management"
          subheader={currentStore ? `Manage users for ${currentStore.nama_toko}` : 'Manage system users'}
          action={
            hasPermission('users.create') && (
              <Button
                variant="contained"
                startIcon={<i className="tabler-plus" />}
                onClick={() => setShowCreateDialog(true)}
              >
                Add User
              </Button>
            )
          }
        />
        
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <CustomTextField
              fullWidth
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <i className="tabler-search text-xl" />
                }
              }}
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Roles</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Created</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar}
                          alt={user.nama_lengkap}
                          sx={{ width: 40, height: 40 }}
                        >
                          {user.nama_lengkap[0]?.toUpperCase()}
                        </Avatar>
                        <div>
                          <Typography variant="body1" className="font-medium">
                            {user.nama_lengkap}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {user.email}
                          </Typography>
                          {user.no_hp && (
                            <Typography variant="caption" color="textSecondary">
                              {user.no_hp}
                            </Typography>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Chip
                            key={role.id}
                            label={role.display_name}
                            color={getRoleChipColor(role.name) as any}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.is_active}
                            onChange={() => handleToggleUserStatus(user)}
                            disabled={!hasPermission('users.update')}
                          />
                        }
                        label={user.is_active ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td className="p-4">
                      <Typography variant="body2">
                        {new Date(user.created_at).toLocaleDateString()}
                      </Typography>
                    </td>
                    <td className="p-4 text-right">
                      <Tooltip title="Actions">
                        <IconButton
                          onClick={(e) => handleActionMenuOpen(e, user)}
                        >
                          <i className="tabler-dots-vertical" />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <i className="tabler-users text-6xl text-gray-300 mb-4" />
                <Typography variant="h6" color="textSecondary">
                  {searchTerm ? 'No users found matching your search' : 'No users found'}
                </Typography>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.total > pagination.per_page && (
            <div className="flex justify-between items-center mt-6">
              <Typography variant="body2" color="textSecondary">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} users
              </Typography>
              
              <div className="flex gap-2">
                <Button
                  variant="outlined"
                  size="small"
                  disabled={pagination.current_page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                >
                  Next
                </Button>
              </div>
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
        {hasPermission('users.update') && (
          <MenuItem
            onClick={() => {
              setShowEditDialog(true)
              handleActionMenuClose()
            }}
          >
            <i className="tabler-edit mr-2" />
            Edit User
          </MenuItem>
        )}
        
        {hasPermission('roles.assign') && (
          <MenuItem
            onClick={() => {
              setShowAssignRoleDialog(true)
              handleActionMenuClose()
            }}
          >
            <i className="tabler-user-cog mr-2" />
            Assign Roles
          </MenuItem>
        )}
        
        {hasPermission('users.delete') && selectedUser && !selectedUser.roles.some(r => r.name === 'superadmin') && (
          <MenuItem
            onClick={() => {
              setShowDeleteDialog(true)
              handleActionMenuClose()
            }}
            className="text-error"
          >
            <i className="tabler-trash mr-2" />
            Delete User
          </MenuItem>
        )}
      </Menu>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateUserDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={loadUsers}
          storeId={storeId}
        />
      )}

      {showEditDialog && selectedUser && (
        <EditUserDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSuccess={loadUsers}
          user={selectedUser}
        />
      )}

      {showAssignRoleDialog && selectedUser && (
        <AssignRoleDialog
          open={showAssignRoleDialog}
          onClose={() => setShowAssignRoleDialog(false)}
          onSuccess={loadUsers}
          user={selectedUser}
          storeId={storeId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user <strong>{selectedUser?.nama_lengkap}</strong>? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default UserList