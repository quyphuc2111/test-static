import { useMutation, useQueryClient } from "@tanstack/react-query"
import { hardDeleteContent } from "../content.service"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

export function useHardDeleteContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contentId: string) => 
      hardDeleteContent(projectId, moduleId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.list(projectId, moduleId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.stats(projectId) 
      })
      toast.success("Đã xóa vĩnh viễn nội dung!")
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.message || "Lỗi khi xóa vĩnh viễn nội dung"
      toast.error(message)
      console.error("Hard delete content error:", error)
    }
  })
}
