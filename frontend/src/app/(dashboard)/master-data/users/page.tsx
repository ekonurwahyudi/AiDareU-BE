// Component Imports
import UserList from '@views/rbac/users/UserList'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

const UserManagementPage = () => {
  return (
    <RBACProvider>
      <UserList />
    </RBACProvider>
  )
}

export default UserManagementPage