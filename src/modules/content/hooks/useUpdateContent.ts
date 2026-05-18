import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateContent } from "../content.service"
import { UpdateContentPayload } from "../content.interface"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

export function useUpdateContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contentId, payload }: { contentId: string; payload: UpdateContentPayload }) =>
      updateContent(projectId, moduleId, contentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.list(projectId, moduleId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.stats(projectId) 
      })
      toast.success("Cập nhật nội dung thành công!")
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.message || "Lỗi khi cập nhật nội dung"
      toast.error(message)
      console.error("Update content error:", error)
    }
  })
}
