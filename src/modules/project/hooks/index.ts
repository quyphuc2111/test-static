// Export interfaces
export * from "../project.interface"

// Export service functions
export {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  listModules,
  createModule,
  updateModule,
  deleteModule,
  getModuleContentCount,
  softDeleteProject,
  hardDeleteProject,
  restoreProject,
  softDeleteModule,
  hardDeleteModule,
  restoreModule,
} from "../project.service"

// Export hooks
export { useProjects } from "./useProjects"
export { useModules } from "./useModules"
export { useUpdateProject } from "./useUpdateProject"
export { useCreateModule } from "./useCreateModule"
export { useUpdateModule } from "./useUpdateModule"
export { useDeleteModule } from "./useDeleteModule"

// New action hooks
export {
  useSoftDeleteProject,
  useHardDeleteProject,
  useRestoreProject,
} from "./useProjectActions"

export {
  useSoftDeleteModule,
  useHardDeleteModule,
  useRestoreModule,
} from "./useModuleActions"
