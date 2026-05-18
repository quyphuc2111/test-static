import { PermissionName, User, UserStatus } from "@prisma/client"

export type AuthContext = {
  user: Pick<User, "id" | "status">
  roles: string[]
  permissions: PermissionName[]
}

export function hasRole(ctx: AuthContext, role: string): boolean {
  return ctx.roles.includes(role)
}

export function hasPermission(ctx: AuthContext, perm: PermissionName): boolean {
  return ctx.permissions.includes(perm) || ctx.roles.includes("ADMINISTRATOR")
}

export function canViewContent(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.VIEW_CONTENT)
}

export function canManageContent(ctx: AuthContext, ownerId?: string): boolean {
  if (ctx.user.status !== UserStatus.ACTIVE) return false
  if (hasPermission(ctx, PermissionName.MANAGE_ALL_CONTENT)) return true
  // User can manage own content
  return hasPermission(ctx, PermissionName.MANAGE_OWN_CONTENT) && ownerId === ctx.user.id.toString()
}

export function canViewOthersContent(ctx: AuthContext): boolean {
  if (ctx.user.status !== UserStatus.ACTIVE) return false
  return hasPermission(ctx, PermissionName.MANAGE_ALL_CONTENT) || !hasPermission(ctx, PermissionName.VIEW_OWN_CONTENT_ONLY)
}

export function canUpload(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.CREATE_CONTENT)
}

export function canManageUsers(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.EDIT_USERS)
}

export function canToggleUserStatus(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.EDIT_USERS)
}

export function canAssignRoles(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.MANAGE_USER_PERMISSIONS)
}

export function canViewAuditLogs(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.VIEW_AUDIT_LOGS)
}



