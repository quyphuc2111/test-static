import { useMutation, useQueryClient } from "@tanstack/react-query"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

async function deleteVersion(projectId: string, moduleId: string, contentId: string, versionId: string) {
  const res = await fetch(
    `/api/projects/${projectId}/modules/${moduleId}/content/${contentId}/versions/${versionId}`,
    { method: "DELETE" }
  )
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Failed to delete version")
  }
  return res.json()
}

export function useDeleteVersion(projectId: string, moduleId: string, contentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (versionId: string) => deleteVersion(projectId, moduleId, contentId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cachedKeys.content.versions(projectId, moduleId, contentId) })
      toast.success("Đã xóa phiên bản")
    },
    onError: (error: any) => {
      toast.error(error.message || "Không thể xóa phiên bản")
    },
  })
}
