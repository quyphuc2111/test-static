import { SoftDeletableEntity, StatusEntity, NamedEntity, OwnedEntity } from "@/types/common"

export interface ContentData extends SoftDeletableEntity, StatusEntity, NamedEntity, OwnedEntity {
  title: string
  contentUrl: string
  contentType: "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
  status: "UPLOADING" | "PROCESSING" | "COMPLETED" | "FAILED"
  progress: number
  fileSize?: number
  projectId: string
  moduleId: string
}

export type CreateContentPayload = {
  title: string
  description?: string
  contentType: "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
  file: File
}

export type UpdateContentPayload = {
  title?: string
  description?: string
}

export type ContentStats = {
  total: number
  completed: number
  processing: number
  failed: number
}
