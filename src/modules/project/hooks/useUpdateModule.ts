import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateModule } from "../project.service"
import cachedKeys from "@/constants/cachedKeys"

export function useUpdateModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
  })
}