import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteContent } from "../content.service"
import { toast } from "react-toastify"

export function useDeleteContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contentId: string) => deleteContent(projectId, moduleId, contentId),
    onSuccess: () => {
      toast.success("Xóa nội dung thành công")
      queryClient.invalidateQueries({ queryKey: ["content", projectId, moduleId] })
      queryClient.invalidateQueries({ queryKey: ["content", "stats", projectId] })
      
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "modules"] })
    },
    onError: () => {
      toast.error("Xóa nội dung thất bại")
    },
  })
}
