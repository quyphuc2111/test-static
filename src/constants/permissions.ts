import { PermissionName } from "@prisma/client"

/**
 * Permission constants for easy reference throughout the application
 */
export const Permissions = {
  // Content Management
  Content: {
    VIEW: PermissionName.VIEW_CONTENT,
    CREATE: PermissionName.CREATE_CONTENT,
    EDIT: PermissionName.EDIT_CONTENT,
    DOWNLOAD: PermissionName.DOWNLOAD_CONTENT,
    SOFT_DELETE: PermissionName.SOFT_DELETE_CONTENT,
    HARD_DELETE: PermissionName.HARD_DELETE_CONTENT,
    VIEW_DELETED_ALL: PermissionName.VIEW_DELETED_ALL_CONTENT,
    VIEW_DELETED_OWN: PermissionName.VIEW_DELETED_OWN_CONTENT,
    RESTORE: PermissionName.RESTORE_CONTENT,
    SHARE: PermissionName.SHARE_CONTENT_ACCESS
  },

  // Content Scope
  ContentScope: {
    MANAGE_ALL: PermissionName.MANAGE_ALL_CONTENT,
    MANAGE_OWN: PermissionName.MANAGE_OWN_CONTENT,
    VIEW_OWN_ONLY: PermissionName.VIEW_OWN_CONTENT_ONLY,
  },

  // Content Sharing
  ContentSharing: {
    VIEW_SHARED: PermissionName.VIEW_SHARED_CONTENT,
    SHARE_ACCESS: PermissionName.SHARE_CONTENT_ACCESS,
  },

  // Project Management
  Project: {
    VIEW: PermissionName.VIEW_PROJECTS,
    CREATE: PermissionName.CREATE_PROJECTS,
    EDIT: PermissionName.EDIT_PROJECTS,
    SOFT_DELETE: PermissionName.SOFT_DELETE_PROJECTS,
    HARD_DELETE: PermissionName.HARD_DELETE_PROJECTS,
    VIEW_DELETED: PermissionName.VIEW_DELETED_PROJECTS,
    RESTORE: PermissionName.RESTORE_PROJECTS,
  },

  // Module Management
  Module: {
    VIEW: PermissionName.VIEW_MODULES,
    CREATE: PermissionName.CREATE_MODULES,
    EDIT: PermissionName.EDIT_MODULES,
    SOFT_DELETE: PermissionName.SOFT_DELETE_MODULES,
    HARD_DELETE: PermissionName.HARD_DELETE_MODULES,
    VIEW_DELETED: PermissionName.VIEW_DELETED_MODULES,
    RESTORE: PermissionName.RESTORE_MODULES,
  },

  // User Management
  User: {
    VIEW: PermissionName.VIEW_USERS,
    CREATE: PermissionName.CREATE_USERS,
    EDIT: PermissionName.EDIT_USERS,
    SOFT_DELETE: PermissionName.SOFT_DELETE_USERS,
    HARD_DELETE: PermissionName.HARD_DELETE_USERS,
    MANAGE_PERMISSIONS: PermissionName.MANAGE_USER_PERMISSIONS,
  },

  // Audit & Dashboard
  Audit: {
    VIEW_LOGS: PermissionName.VIEW_AUDIT_LOGS,
    VIEW_DASHBOARD: PermissionName.VIEW_DASHBOARD_STATS,
  },
} as const

/**
 * Helper to get all permissions for a specific resource
 */
export const getResourcePermissions = (resource: keyof typeof Permissions) => {
  return Object.values(Permissions[resource])
}
