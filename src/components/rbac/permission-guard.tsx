"use client"

import { ReactNode } from "react"
import { useUserPermissions } from "@/modules/rbac/hooks/useUserPermissions"
import { PermissionName } from "@prisma/client"

interface PermissionGuardProps {
  permission?: PermissionName
  permissions?: PermissionName[]
  requireAll?: boolean
  role?: string
  roles?: string[]
  requireAnyRole?: boolean
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  requireAnyRole = false,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } = useUserPermissions()

  // Check permission-based access
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  if (permissions) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  // Check role-based access
  if (role && !hasRole(role)) {
    return <>{fallback}</>
  }

  if (roles) {
    const hasAccess = requireAnyRole 
      ? hasAnyRole(roles)
      : roles.every(r => hasRole(r))
    
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}
