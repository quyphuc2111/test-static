import { PermissionName, UserStatus } from "@prisma/client"
import { BaseEntity, StatusEntity, NamedEntity, ApiResponse } from "@/types/common"

export type LoginPayload = {
  login: string // username or email
  password: string
}

export interface AuthUser extends BaseEntity, StatusEntity {
  username: string
  email?: string | null
  name?: string | null
  status: UserStatus
  roles: Array<{
    id: string
    name: string
    description?: string
  }>
  permissions: Array<{
    id: string
    name: PermissionName
    description?: string
  }>
  token?: string
}

export interface LoginResponse extends ApiResponse<AuthUser> {
  user: AuthUser
}


