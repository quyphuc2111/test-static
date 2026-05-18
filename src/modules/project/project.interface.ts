/**
 * Project module interfaces and types
 */
import { FullEntity, SoftDeletableEntity, StatusEntity, NamedEntity } from "@/types/common"

export interface Project extends FullEntity {
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
  modules?: Module[]
}

export interface Module extends SoftDeletableEntity, StatusEntity, NamedEntity {
  status: "ACTIVE" | "INACTIVE"
  content?: any[]
}

export interface CreateProjectPayload {
  name: string
  description?: string
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED"
  modules?: string[]
}

export interface UpdateProjectPayload {
  name: string
  description?: string
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED"
}

export interface CreateModulePayload {
  projectId: string
  name: string
  description?: string
  status?: "ACTIVE" | "INACTIVE"
}

export interface UpdateModulePayload {
  projectId: string
  moduleId: string
  name: string
  description?: string
  status?: "ACTIVE" | "INACTIVE"
}

import { ActionResponse } from "@/types/common"

export interface ProjectActionResponse extends ActionResponse {}

export interface ModuleActionResponse extends ActionResponse {}

export interface ModuleContentCountResponse {
  count: number
}

import { FilterOptions } from "@/types/common"

export interface ListProjectsParams extends FilterOptions {}
