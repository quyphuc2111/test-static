import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getContentShares, shareContent, removeContentShare, bulkShareContent, revokeContentShare, updateContentShare } from "../rbac.service"
import { ShareContentPayload, BulkSharePayload } from "../rbac.interface"

export function useContentShares(userId?: string, contentId?: string) {
  return useQuery({
    queryKey: ["rbac", "content-shares", userId, contentId],
    queryFn: () => getContentShares(
      userId ? parseInt(userId) : undefined, 
      contentId ? parseInt(contentId) : undefined
    ),
  })
}

export function useShareContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ShareContentPayload) => shareContent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "content-shares"] })
    },
  })
}

export function useRemoveContentShare() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contentId, sharedWithId }: { contentId: string; sharedWithId: string }) => 
      removeContentShare(parseInt(contentId), parseInt(sharedWithId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "content-shares"] })
    },
  })
}

export function useBulkShareContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BulkSharePayload) => bulkShareContent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "content-shares"] })
    },
  })
}

export function useRevokeContentShare() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shareId, batchId }: { shareId?: number; batchId?: number }) => 
      revokeContentShare(shareId, batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "content-shares"] })
    },
  })
}

export function useUpdateContentShare() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shareId, canView, canDownload, canEdit, canDelete }: { 
      shareId: number; 
      canView: boolean; 
      canDownload: boolean; 
      canEdit: boolean; 
      canDelete: boolean 
    }) => updateContentShare(shareId, canView, canDownload, canEdit, canDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "content-shares"] })
    },
  })
}
