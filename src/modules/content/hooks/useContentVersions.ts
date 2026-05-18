import { useQuery } from "@tanstack/react-query"
import httpService from "@/services/instance"
import { CONTENT_API_URL } from "@/constants/apiUrl"
import cachedKeys from "@/constants/cachedKeys"

export interface ContentVersionData {
  id: number
  version: number
  contentUrl: string
  launchFile: string | null
  fileSize: number | null
  archiveSize: number | null
  status: "COMPLETED" | "FAILED" | "PROCESSING"
  errorMessage: string | null
  contentId: number
  createdById: number | null
  createdBy: {
    id: number
    username: string
    name: string | null
  } | null
  createdAt: string
  isCurrent?: boolean
}

export function useContentVersions(projectId: string, moduleId: string, contentId: string, enabled = true) {
  return useQuery<ContentVersionData[]>({
    queryKey: cachedKeys.content.versions(projectId, moduleId, contentId),
    queryFn: async () => {
      const res = await httpService.get<{ data: ContentVersionData[] }>({
        url: CONTENT_API_URL.VERSIONS(projectId, moduleId, contentId)
      })
      return res.data
    },
    enabled: enabled && !!projectId && !!moduleId && !!contentId,
  })
}
