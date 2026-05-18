const rawBase = process.env.NEXT_PUBLIC_BASE_URL || ""
const normalizedBase = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase
export const API_BASE_URL = normalizedBase ? `${normalizedBase}/api` : "/api"

export const AUTH_API_URL = {
    LOGIN: "auth/login",
    LOGOUT: "auth/logout",
    ME: "auth/me",
}

export const PROJECTS_API_URL = {
    ROOT: "projects",
    BY_ID: (id: string) => `projects/${id}`,
    MODULES: (id: string) => `projects/${id}/modules`,
    MODULE_BY_ID: (projectId: string, moduleId: string) => `projects/${projectId}/modules/${moduleId}`,
    SOFT_DELETE: (id: string) => `projects/${id}/soft-delete`,
    HARD_DELETE: (id: string) => `projects/${id}/hard-delete`,
    RESTORE: (id: string) => `projects/${id}/restore`,
    MODULE_SOFT_DELETE: (projectId: string, moduleId: string) => `projects/${projectId}/modules/${moduleId}/soft-delete`,
    MODULE_HARD_DELETE: (projectId: string, moduleId: string) => `projects/${projectId}/modules/${moduleId}/hard-delete`,
    MODULE_RESTORE: (projectId: string, moduleId: string) => `projects/${projectId}/modules/${moduleId}/restore`,
    MODULE_CONTENT_COUNT: (moduleId: string) => `projects/modules/${moduleId}/content/count`,
}

export const CONTENT_API_URL = {
    ROOT: (projectId: string, moduleId: string) => `projects/${projectId}/modules/${moduleId}/content`,
    BY_ID: (projectId: string, moduleId: string, contentId: string) => `projects/${projectId}/modules/${moduleId}/content/${contentId}`,
    DOWNLOAD: (projectId: string, moduleId: string, contentId: string) => `projects/${projectId}/modules/${moduleId}/content/${contentId}/download`,
    SOFT_DELETE: (projectId: string, moduleId: string, contentId: string) => `projects/${projectId}/modules/${moduleId}/content/${contentId}/soft-delete`,
    HARD_DELETE: (projectId: string, moduleId: string, contentId: string) => `projects/${projectId}/modules/${moduleId}/content/${contentId}/hard-delete`,
    BULK_DELETE: (projectId: string, moduleId: string) => `projects/${projectId}/modules/${moduleId}/content/bulk-delete`,
    IMPORT: (projectId: string, moduleId: string) => `projects/${projectId}/modules/${moduleId}/content/import`,
    VERSIONS: (projectId: string, moduleId: string, contentId: string) => `projects/${projectId}/modules/${moduleId}/content/${contentId}/versions`,
    RESTORE_VERSION: (projectId: string, moduleId: string, contentId: string, versionId: string) => `projects/${projectId}/modules/${moduleId}/content/${contentId}/versions/${versionId}/restore`,
    STATS: (projectId?: string) => projectId ? `projects/${projectId}/content/stats` : "content/stats",
}
