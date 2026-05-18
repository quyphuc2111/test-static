import { useMutation, useQueryClient } from "@tanstack/react-query"
import { softDeleteContent } from "../content.service"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

export function useSoftDeleteContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contentId: string) => 
      softDeleteContent(projectId, moduleId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.list(projectId, moduleId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.stats(projectId) 
      })
      toast.success("Đã chuyển nội dung vào thùng rác!")
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.message || "Lỗi khi xóa mềm nội dung"
      toast.error(message)
      console.error("Soft delete content error:", error)
    }
  })
}
