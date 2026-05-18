import { useMutation, useQueryClient } from "@tanstack/react-query"
import httpService from "@/services/instance"
import { CONTENT_API_URL } from "@/constants/apiUrl"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

export function useRestoreVersion(projectId: string, moduleId: string, contentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (versionId: string) => {
      const res = await httpService.post<{ message: string; data: any }>({
        url: CONTENT_API_URL.RESTORE_VERSION(projectId, moduleId, contentId, versionId)
      })
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cachedKeys.content.versions(projectId, moduleId, contentId) })
      queryClient.invalidateQueries({ queryKey: cachedKeys.content.list(projectId, moduleId) })
      toast.success("Đã khôi phục phiên bản thành công")
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể khôi phục phiên bản")
    }
  })
}
