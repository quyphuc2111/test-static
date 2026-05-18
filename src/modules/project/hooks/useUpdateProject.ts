import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProject } from "../project.service"
import { toast } from "react-toastify"
import cachedKeys from "@/constants/cachedKeys"
import { UpdateProjectPayload } from "../project.interface"

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateProjectPayload) => updateProject(projectId, payload),
    onSuccess: () => {
      toast.success("Cập nhật dự án thành công")
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
      queryClient.invalidateQueries({ queryKey: cachedKeys.project.detail(projectId) })
    },
    onError: (e: any) => {
      if (e?.response?.status === 409) {
        toast.error(e?.response?.data?.message || "Tên dự án đã tồn tại")
      } else {
        toast.error("Cập nhật dự án thất bại")
      }
    },
  })
}
