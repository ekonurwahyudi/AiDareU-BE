// Component Imports
import PermissionList from '@views/rbac/permissions/PermissionList'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

const PermissionManagementPage = () => {
  return (
    <RBACProvider>
      <PermissionList />
    </RBACProvider>
  )
}

export default PermissionManagementPage