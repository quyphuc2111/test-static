import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getModuleShares, shareModule, updateModuleShare, revokeModuleShare } from "../rbac.service"
import { ShareModulePayload, UpdateModuleSharePayload } from "../rbac.interface"
import { toast } from "react-toastify"

export function useModuleShares(moduleId?: number) {
  return useQuery({
    queryKey: ["rbac", "module-shares", moduleId],
    queryFn: () => getModuleShares(moduleId!),
    enabled: !!moduleId,
  })
}

export function useShareModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ShareModulePayload) => shareModule(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "module-shares", variables.moduleId] })
      toast.success("Đã chia sẻ module thành công")
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || "Lỗi khi chia sẻ module"
      toast.error(msg)
    },
  })
}

export function useUpdateModuleShare(moduleId?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateModuleSharePayload) => updateModuleShare(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "module-shares", moduleId] })
      toast.success("Đã cập nhật quyền")
    },
    onError: () => {
      toast.error("Lỗi khi cập nhật quyền")
    },
  })
}

export function useRevokeModuleShare(moduleId?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (shareId: number) => revokeModuleShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "module-shares", moduleId] })
      toast.success("Đã thu hồi quyền truy cập")
    },
    onError: () => {
      toast.error("Lỗi khi thu hồi quyền")
    },
  })
}
