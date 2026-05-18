import { useMutation, useQueryClient } from "@tanstack/react-query"
import { restoreContent } from "../content.service"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

export function useRestoreContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contentId: string) => 
      restoreContent(projectId, moduleId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.list(projectId, moduleId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.stats(projectId) 
      })
      toast.success("Khôi phục nội dung thành công!")
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.message || "Lỗi khi khôi phục nội dung"
      toast.error(message)
      console.error("Restore content error:", error)
    }
  })
}

