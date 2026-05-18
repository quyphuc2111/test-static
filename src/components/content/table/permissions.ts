import { PermissionName } from "@prisma/client"
import { ContentItem } from "./columns"

interface UserPermissionsHook {
  hasPermission: (permission: PermissionName) => boolean
  hasAnyPermission: (permissions: PermissionName[]) => boolean
  isAdmin: boolean
}

export interface ContentPermissions {
  // View permissions
  canView: boolean
  canViewDetails: boolean
  canCopyUrl: boolean
  
  // Edit permissions
  canEdit: boolean
  canUpload: boolean
  canUpdate: boolean
  
  // Download permissions
  canDownload: boolean
  
  // Delete permissions
  canSoftDelete: boolean
  canHardDelete: boolean
  
  // Restore permissions
  canRestore: boolean
  
  // Helper flags
  isOwner: boolean
  isShared: boolean
  isDeleted: boolean
  hasFile: boolean
}

/**
 * Calculate content permissions based on:
 * 1. System RBAC permissions
 * 2. Content ownership
 * 3. Share permissions (if content is shared with user)
 */
export function calculateContentPermissions(
  content: ContentItem,
  currentUserId: string | undefined,
  userPermissions: UserPermissionsHook
): ContentPermissions {
  const { hasPermission, hasAnyPermission, isAdmin } = userPermissions
  
  // Basic flags
  const isOwner = content.owner?.id === currentUserId
  const isShared = content.isShared === true
  const isDeleted = content.isDeleted === true
  const hasFile = Boolean(content.contentUrl && content.contentUrl.trim() !== "")
  
  // Share permissions (from ContentShare model)
  const sharePerms = content.sharePermissions
  
  // System RBAC permissions
  const hasViewSystem = hasPermission(PermissionName.VIEW_CONTENT)
  const hasCreateSystem = hasPermission(PermissionName.CREATE_CONTENT)
  const hasEditSystem = hasPermission(PermissionName.EDIT_CONTENT)
  const hasDownloadSystem = hasAnyPermission([PermissionName.VIEW_CONTENT]) // Download requires at least view
  const hasSoftDeleteSystem = hasPermission(PermissionName.SOFT_DELETE_CONTENT)
  const hasHardDeleteSystem = hasPermission(PermissionName.HARD_DELETE_CONTENT)
  const hasRestoreSystem = hasPermission(PermissionName.SOFT_DELETE_CONTENT) // Same as soft delete
  const hasManageAllContent = hasPermission(PermissionName.MANAGE_ALL_CONTENT)
  const hasManageOwnContent = hasPermission(PermissionName.MANAGE_OWN_CONTENT)
  
  // For deleted content, only allow restore and hard delete (admin only)
  if (isDeleted) {
    return {
      canView: true, // Can view details even if deleted
      canViewDetails: true,
      canCopyUrl: false,
      canEdit: false,
      canUpload: false,
      canUpdate: false,
      canDownload: false,
      canSoftDelete: false,
      canHardDelete: Boolean(isAdmin && hasHardDeleteSystem),
      canRestore: Boolean((isOwner || hasManageAllContent || isAdmin) && hasRestoreSystem),
      isOwner,
      isShared,
      isDeleted,
      hasFile
    }
  }
  
  // Calculate permissions based on ownership and sharing
  let canView = false
  let canEdit = false
  let canDownload = false
  let canDelete = false
  
  if (isOwner) {
    // Owner has full control (unless explicitly restricted by system permissions)
    canView = hasViewSystem || hasManageOwnContent || hasManageAllContent
    canEdit = hasEditSystem || hasManageOwnContent || hasManageAllContent
    canDownload = hasDownloadSystem || hasManageOwnContent || hasManageAllContent
    canDelete = hasSoftDeleteSystem || hasManageOwnContent || hasManageAllContent
  } else if (isShared && sharePerms) {
    // Shared content: check share permissions + system permissions
    canView = (hasViewSystem || hasManageAllContent) && (sharePerms.canView === true)
    canEdit = (hasEditSystem || hasManageAllContent) && (sharePerms.canEdit === true)
    canDownload = (hasDownloadSystem || hasManageAllContent) && (sharePerms.canDownload === true)
    canDelete = (hasSoftDeleteSystem || hasManageAllContent) && (sharePerms.canDelete === true)
  } else if (hasManageAllContent) {
    // Admin or user with MANAGE_ALL_CONTENT can access everything
    canView = true
    canEdit = true
    canDownload = true
    canDelete = true
  }
  
  // Override for admin
  if (isAdmin) {
    canView = true
    canEdit = true
    canDownload = true
    canDelete = true
  }
  
  return {
    // View permissions
    canView: Boolean(canView),
    canViewDetails: Boolean(canView),
    canCopyUrl: Boolean(canView && hasFile),
    
    // Edit permissions
    canEdit: Boolean(canEdit),
    canUpload: Boolean(canEdit && !hasFile && hasCreateSystem),
    canUpdate: Boolean(canEdit && hasFile),
    
    // Download permissions
    canDownload: Boolean(canDownload && hasFile),
    
    // Delete permissions
    canSoftDelete: Boolean(canDelete && !isDeleted),
    canHardDelete: Boolean(isAdmin && hasHardDeleteSystem && !isDeleted),
    
    // Restore permissions
    canRestore: false, // Already handled in deleted section
    
    // Helper flags
    isOwner,
    isShared,
    isDeleted,
    hasFile
  }
}

