import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createModule } from "../project.service"

export function useCreateModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createModule,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.projectId, "modules"] })
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
  })
}
