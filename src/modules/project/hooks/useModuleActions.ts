import { useMutation, useQueryClient } from "@tanstack/react-query"
import { softDeleteModule, hardDeleteModule, restoreModule } from "../project.service"
import cachedKeys from "@/constants/cachedKeys"

/**
 * Hook for soft deleting a module
 */
export function useSoftDeleteModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, moduleId }: { projectId: string; moduleId: string }) => 
      softDeleteModule(projectId, moduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: cachedKeys.project.modules(variables.projectId),
      })
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
  })
}

/**
 * Hook for hard deleting a module
 */
export function useHardDeleteModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, moduleId }: { projectId: string; moduleId: string }) => 
      hardDeleteModule(projectId, moduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: cachedKeys.project.modules(variables.projectId),
      })
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
  })
}

/**
 * Hook for restoring a deleted module
 */
export function useRestoreModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, moduleId }: { projectId: string; moduleId: string }) => 
      restoreModule(projectId, moduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: cachedKeys.project.modules(variables.projectId),
      })
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
  })
}
