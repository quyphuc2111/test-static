import { ProjectStatus } from "@prisma/client"

/**
 * Project status constants
 */
export const PROJECT_STATUS = {
  ACTIVE: ProjectStatus.ACTIVE,
  INACTIVE: ProjectStatus.INACTIVE,
  ARCHIVED: ProjectStatus.ARCHIVED,
} as const

/**
 * Project status labels in Vietnamese
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]: "Đang hoạt động",
  [ProjectStatus.INACTIVE]: "Tạm dừng",
  [ProjectStatus.ARCHIVED]: "Đã lưu trữ",
}

/**
 * Project action constants
 */
export const PROJECT_ACTIONS = {
  CREATE: "create",
  EDIT: "edit",
  SOFT_DELETE: "soft-delete",
  HARD_DELETE: "hard-delete",
  RESTORE: "restore",
  VIEW: "view",
} as const

export type ProjectAction = (typeof PROJECT_ACTIONS)[keyof typeof PROJECT_ACTIONS]
