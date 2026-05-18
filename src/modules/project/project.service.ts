import httpService from "@/services/instance"
import { PROJECTS_API_URL } from "@/constants/apiUrl"
import { Project, CreateProjectPayload, UpdateProjectPayload, CreateModulePayload, UpdateModulePayload, ModuleContentCountResponse, ProjectActionResponse, ModuleActionResponse } from "./project.interface"

export async function listProjects(params?: { includeDeleted?: boolean; onlyDeleted?: boolean }) {
  const searchParams = new URLSearchParams()
  if (params?.includeDeleted) searchParams.set('includeDeleted', 'true')
  if (params?.onlyDeleted) searchParams.set('onlyDeleted', 'true')
  
  const url = `${PROJECTS_API_URL.ROOT}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const res = await httpService.get<{ data: Project[] }>({ url })
  return res.data
}

export async function createProject(payload: CreateProjectPayload) {
  const res = await httpService.post<{ data: Project }>({ url: PROJECTS_API_URL.ROOT, data: payload })
  return res.data
}

export async function updateProject(id: string, payload: UpdateProjectPayload) {
  const res = await httpService.patch<{ data: Project }>({ url: PROJECTS_API_URL.BY_ID(id), data: payload })
  return res.data
}

export async function deleteProject(id: string) {
  return httpService.delete<{ success: boolean }>({ url: PROJECTS_API_URL.BY_ID(id) })
}

export async function listModules(projectId: string) {
  const res = await httpService.get<{ data: { id: string; name: string; description?: string; status: "ACTIVE" | "INACTIVE" }[] }>({ url: PROJECTS_API_URL.MODULES(projectId) })
  return res.data
}

export async function createModule(payload: CreateModulePayload) {
  const res = await httpService.post<{ data: { id: string; name: string; description?: string; status: string } }>({ 
    url: PROJECTS_API_URL.MODULES(payload.projectId), 
    data: { name: payload.name, description: payload.description, status: payload.status || "ACTIVE" } 
  })
  return res.data
}

export async function updateModule(payload: UpdateModulePayload) {
  const res = await httpService.patch<{ data: { id: string; name: string; description?: string; status: string } }>({ 
    url: PROJECTS_API_URL.MODULE_BY_ID(payload.projectId, payload.moduleId), 
    data: { name: payload.name, description: payload.description, status: payload.status || "ACTIVE" } 
  })
  return res.data
}

export async function deleteModule(args: { projectId: string; moduleId: string }) {
  return httpService.delete<{ success: boolean }>({ url: PROJECTS_API_URL.MODULE_BY_ID(args.projectId, args.moduleId) })
}

export async function getModuleContentCount(moduleId: string) {
  const res = await httpService.get<{ data: ModuleContentCountResponse }>({ 
    url: PROJECTS_API_URL.MODULE_CONTENT_COUNT(moduleId)
  })
  return res.data
}

// Project Actions
export async function softDeleteProject(projectId: string) {
  const res = await httpService.post<ProjectActionResponse>({
    url: PROJECTS_API_URL.SOFT_DELETE(projectId)
  })
  return res
}

export async function hardDeleteProject(projectId: string) {
  const res = await httpService.delete<ProjectActionResponse>({
    url: PROJECTS_API_URL.HARD_DELETE(projectId)
  })
  return res
}

export async function restoreProject(projectId: string) {
  const res = await httpService.post<ProjectActionResponse>({
    url: PROJECTS_API_URL.RESTORE(projectId)
  })
  return res
}

// Module Actions
export async function softDeleteModule(projectId: string, moduleId: string) {
  const res = await httpService.post<ModuleActionResponse>({
    url: PROJECTS_API_URL.MODULE_SOFT_DELETE(projectId, moduleId)
  })
  return res
}

export async function hardDeleteModule(projectId: string, moduleId: string) {
  const res = await httpService.delete<ModuleActionResponse>({
    url: PROJECTS_API_URL.MODULE_HARD_DELETE(projectId, moduleId)
  })
  return res
}

export async function restoreModule(projectId: string, moduleId: string) {
  const res = await httpService.post<ModuleActionResponse>({
    url: PROJECTS_API_URL.MODULE_RESTORE(projectId, moduleId)
  })
  return res
}


