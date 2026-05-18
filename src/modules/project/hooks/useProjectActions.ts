import { useMutation, useQueryClient } from "@tanstack/react-query"
import { softDeleteProject, hardDeleteProject, restoreProject } from "../project.service"
import { toast } from "react-toastify"

export function useSoftDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: softDeleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.data?.message || error?.message || "Xóa dự án thất bại"
      toast.error(message)
    },
  })
}

export function useHardDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hardDeleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.data?.message || error?.message || "Xóa vĩnh viễn dự án thất bại"
      toast.error(message)
    },
  })
}

export function useRestoreProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restoreProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.data?.message || error?.message || "Khôi phục dự án thất bại"
      toast.error(message)
    },
  })
}
