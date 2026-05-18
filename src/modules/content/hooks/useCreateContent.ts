import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createContent } from "../content.service"
import { CreateContentPayload } from "../content.interface"
import { toast } from "react-toastify"
import { useRef } from "react"

export function useCreateContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()

  const optimisticIdRef = useRef<string>("")

  const updateOptimisticProgress = (progress: number) => {
    const queryKey = ["content", projectId, moduleId]
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old
      const updateItem = (items: any[]) =>
        items.map((item: any) =>
          item.id === optimisticIdRef.current
            ? { ...item, progress, ...(progress >= 100 ? { status: "PROCESSING", progress: undefined } : {}) }
            : item
        )
      if (Array.isArray(old)) return updateItem(old)
      return { ...old, data: updateItem(old.data || []) }
    })
  }

  return useMutation({
    mutationFn: (payload: CreateContentPayload) =>
      createContent(projectId, moduleId, payload, (progress) => {
        updateOptimisticProgress(progress)
      }),
    onMutate: async (payload) => {
      const queryKey = ["content", projectId, moduleId]
      await queryClient.cancelQueries({ queryKey })

      const previousData = queryClient.getQueryData(queryKey)

      const tempId = `temp-${Date.now()}`
      optimisticIdRef.current = tempId

      const optimisticItem = {
        id: tempId,
        title: payload.title,
        contentType: payload.contentType,
        description: payload.description || null,
        contentUrl: "",
        status: "UPLOADING" as const,
        progress: 0,
        fileSize: payload.file?.size || 0,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId,
        moduleId,
      }

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return { data: [optimisticItem] }
        if (Array.isArray(old)) return [optimisticItem, ...old]
        return { ...old, data: [optimisticItem, ...(old.data || [])] }
      })

      return { previousData }
    },
    onSuccess: () => {
      optimisticIdRef.current = ""
      toast.success("Đang xử lý nội dung...")
      queryClient.invalidateQueries({ queryKey: ["content", projectId, moduleId] })
      queryClient.invalidateQueries({ queryKey: ["content", "stats"] })
      // Realtime processing updates are handled by useContentSSE. Avoid
      // additional polling here because it causes repeated refetches/re-renders
      // right after uploading/updating content.
    },
    onError: (e: any, _payload, context) => {
      optimisticIdRef.current = ""
      if (context?.previousData) {
        queryClient.setQueryData(["content", projectId, moduleId], context.previousData)
      }
      if (e?.response?.status === 413) {
        toast.error("File quá lớn, vui lòng chọn file nhỏ hơn")
      } else if (e?.response?.status === 400) {
        toast.error(e?.response?.data?.message || "Dữ liệu không hợp lệ")
      } else if (e?.response?.status === 409) {
        toast.error(e?.response?.data?.error || "Tiêu đề đã tồn tại")
      } else {
        toast.error("Tạo nội dung thất bại")
      }
    },
  })
}
