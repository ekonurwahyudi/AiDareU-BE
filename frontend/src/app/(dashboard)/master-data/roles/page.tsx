// Component Imports
import RoleList from '@views/rbac/roles/RoleList'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

const RoleManagementPage = () => {
  return (
    <RBACProvider>
      <RoleList />
    </RBACProvider>
  )
}

export default RoleManagementPage