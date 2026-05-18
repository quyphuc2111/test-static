import { ModuleStatus } from "@prisma/client"

/**
 * Module status constants
 */
export const MODULE_STATUS = {
  ACTIVE: ModuleStatus.ACTIVE,
  INACTIVE: ModuleStatus.INACTIVE,
} as const

/**
 * Module status labels in Vietnamese
 */
export const MODULE_STATUS_LABELS: Record<ModuleStatus, string> = {
  [ModuleStatus.ACTIVE]: "Đang hoạt động",
  [ModuleStatus.INACTIVE]: "Tạm dừng",
}

/**
 * Module action constants
 */
export const MODULE_ACTIONS = {
  CREATE: "create",
  EDIT: "edit",
  SOFT_DELETE: "soft-delete",
  HARD_DELETE: "hard-delete",
  RESTORE: "restore",
  VIEW: "view",
} as const

export type ModuleAction = (typeof MODULE_ACTIONS)[keyof typeof MODULE_ACTIONS]
