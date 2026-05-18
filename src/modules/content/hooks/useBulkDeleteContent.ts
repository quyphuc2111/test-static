import { useMutation, useQueryClient } from "@tanstack/react-query"
import { bulkDeleteContent } from "../content.service"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

export function useBulkDeleteContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contentIds: string[]) => 
      bulkDeleteContent(projectId, moduleId, contentIds),
    onSuccess: (data) => {
      // Invalidate queries using cachedKeys
      queryClient.invalidateQueries({
        queryKey: cachedKeys.content.list(projectId, moduleId)
      })
      queryClient.invalidateQueries({
        queryKey: cachedKeys.content.stats(projectId)
      })
      queryClient.invalidateQueries({
        queryKey: ["projects", "list"]
      })
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "modules"]
      })
      
      toast.success(`Đã xóa ${data.deletedCount} nội dung thành công`)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "Lỗi khi xóa nội dung"
      toast.error(message)
      console.error("Bulk delete error:", error)
    }
  })
}
