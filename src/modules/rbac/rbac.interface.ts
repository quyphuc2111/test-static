export interface Role {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  permissions?: RolePermission[]
  users?: UserRole[]
}

export interface Permission {
  id: number
  name: string
  nameVi?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface RolePermission {
  roleId: number
  permissionId: number
  role?: Role
  permission?: Permission
}

export interface UserRole {
  userId: number
  roleId: number
  user?: {
    id: number
    name?: string
    email: string
  }
  role?: Role
}

export interface ContentShare {
  id: number
  contentId: number
  sharedById: number
  sharedWithId: number
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  createdAt: string
  updatedAt: string
  content?: {
    id: number
    title: string
    contentType: string
    status: string
  }
  sharedBy?: {
    id: number
    name?: string
    email: string
  }
  sharedWith?: {
    id: number
    name?: string
    email: string
  }
}

export interface CreateRolePayload {
  name: string
  description?: string
  permissionIds: number[]
}

export interface AssignRolePayload {
  userId: number
  roleId: number
}

export interface ShareContentPayload {
  contentId: number
  sharedWithId: number
  canView?: boolean
  canDownload?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export interface ModuleShareItem {
  id: number
  moduleId: number
  projectId: number
  sharedById: number
  sharedWithId: number
  permission: "VIEW" | "DOWNLOAD" | "EDIT"
  status: "ACTIVE" | "REVOKED"
  createdAt: string
  updatedAt: string
  sharedBy?: {
    id: number
    name?: string
    email?: string
    username: string
  }
  sharedWith?: {
    id: number
    name?: string
    email?: string
    username: string
  }
  module?: {
    id: number
    name: string
  }
  project?: {
    id: number
    name: string
  }
}

export interface ShareModulePayload {
  moduleId: number
  projectId: number
  sharedWithId: number
  permission?: "VIEW" | "DOWNLOAD" | "EDIT"
}

export interface UpdateModuleSharePayload {
  id: number
  permission: "VIEW" | "DOWNLOAD" | "EDIT"
}

export interface BulkSharePayload {
  sharedWithId: number
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canDownload?: boolean
  projectId?: number
  moduleId?: number
  ownerId?: number
  contentIds?: number[]
}

export interface UserWithRoles {
  id: number
  username: string
  name?: string
  email?: string
  status: string
  createdAt: string
  updatedAt: string
  roles?: UserRole[]
}

export interface CreateUserPayload {
  username: string
  name?: string
  email?: string
  status?: string
  roleId?: number
  password?: string
}

export interface UpdateUserPayload {
  username?: string
  name?: string
  email?: string
  status?: string
  password?: string
  roleId?: number
}

export interface RoleWithPermissions extends Role {
  isActive?: boolean
  permissions: (RolePermission & { permission: Permission })[]
}
