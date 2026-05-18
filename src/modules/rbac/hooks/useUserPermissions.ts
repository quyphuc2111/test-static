"use client"

import { useAuth } from "@/modules/auth/hooks/useAuth"
import { PermissionName } from "@prisma/client"

export function useUserPermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: PermissionName): boolean => {
    if (!user?.permissions) return false
    return user.permissions.some(p => p.name === permission)
  }

  const hasAnyPermission = (permissions: PermissionName[]): boolean => {
    if (!user?.permissions) return false
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: PermissionName[]): boolean => {
    if (!user?.permissions) return false
    return permissions.every(permission => hasPermission(permission))
  }

  const hasRole = (roleName: string): boolean => {
    if (!user?.roles) return false
    return user.roles.some(role => role.name === roleName)
  }

  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!user?.roles) return false
    return roleNames.some(roleName => hasRole(roleName))
  }

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin: hasRole("ADMINISTRATOR"),
    isDeveloper: hasRole("DEV"),
    isTester: hasRole("TESTER"),
  }
}
