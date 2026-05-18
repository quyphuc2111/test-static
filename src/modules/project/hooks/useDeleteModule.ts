import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteModule } from "../project.service"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

export function useDeleteModule(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cachedKeys.project.modules(projectId) })
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.data?.message || error?.message || "Xóa module thất bại"
      toast.error(message)
    },
  })
}