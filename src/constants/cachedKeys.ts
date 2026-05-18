const cachedKeys = {
    auth: {
        me: ["auth", "me"],
    },
    rbac: {
        roles: ["rbac", "roles"],
        permissions: ["rbac", "permissions"],
        users: ["rbac", "users"],
        userRoles: (userId: string) => ["rbac", "userRoles", userId],
        contentSharing: ["rbac", "contentSharing"],
    },
    content: {
        list: (projectId: string, moduleId: string) => ["content", projectId, moduleId],
        stats: (projectId?: string) => projectId ? ["content", "stats", projectId] : ["content", "stats"],
        versions: (projectId: string, moduleId: string, contentId: string) => ["content-versions", projectId, moduleId, contentId],
    },
    project: {
        list: (params?: any) => ["projects", "list", params],
        detail: (projectId: string) => ["projects", projectId],
        modules: (projectId: string) => ["projects", projectId, "modules"],
        moduleContentCount: (moduleId: string) => ["module-content-count", moduleId],
    },
}

export default cachedKeys