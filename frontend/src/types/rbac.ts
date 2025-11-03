// RBAC Types
export interface Permission {
  id: number
  name: string
  display_name: string
  description: string
  module: string
  action: string
  resource: string
  is_system: boolean
}

export interface Role {
  id: number
  name: string
  display_name: string
  description?: string
  level: number
  is_system: boolean
  permissions?: Permission[]
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  nama_lengkap: string
  email: string
  no_hp: string
  avatar?: string
  email_verified_at?: string
  roles: Role[]
  stores?: Store[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  uuid: string
  nama_toko: string
  name?: string
  sub_domain: string
  subdomain?: string
  domain?: string
  no_hp_toko: string
  phone?: string
  kategori_toko: string
  deskripsi_toko: string
  logo?: string
  banner?: string
  alamat?: string
  is_active: boolean
  owner_id: string
  owner: User
  users: User[]
  created_at: string
  updated_at: string
}

export interface RolePermissionMatrix {
  [roleId: string]: {
    [permissionId: string]: boolean
  }
}

// Permission Actions
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage'
}

// Permission Modules
export enum PermissionModule {
  USERS = 'users',
  ROLES = 'roles',
  PERMISSIONS = 'permissions',
  STORES = 'stores',
  PRODUCTS = 'products',
  ORDERS = 'orders',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  CONTENT = 'content'
}

// System Roles
export enum SystemRole {
  SUPERADMIN = 'superadmin',
  OWNER = 'owner',
  ADMIN_TOKO = 'admin_toko'
}

// RBAC Context
export interface RBACContextType {
  user: User | null
  currentStore: Store | null
  permissions: Permission[]
  roles: Role[]
  isLoading: boolean
  hasPermission: (permission: string, resource?: string) => boolean
  hasRole: (role: string) => boolean
  canAccess: (resource: string, action: string) => boolean
  switchStore: (storeId: string) => Promise<void>
  refreshPermissions: () => Promise<void>
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T = any> {
  data: T[]
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
}

// Form Types
export interface CreateRoleForm {
  name: string
  display_name: string
  description: string
  permissions: number[]
}

export interface UpdateRoleForm extends CreateRoleForm {
  id: number
}

export interface AssignRoleForm {
  user_id: string
  role_ids: number[]
  store_id?: string
}

export interface CreateUserForm {
  nama_lengkap: string
  email: string
  no_hp: string
  password: string
  role_ids: number[]
  store_id?: string
}

export interface UpdateUserForm {
  id: string
  nama_lengkap: string
  email: string
  no_hp: string
  role_ids: number[]
  is_active: boolean
}