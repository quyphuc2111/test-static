import { useQuery } from "@tanstack/react-query"
import { listContent } from "../content.service"

export function useContent(projectId: string, moduleId: string, enabled = true) {
  return useQuery({
    queryKey: ["content", projectId, moduleId],
    queryFn: () => listContent(projectId, moduleId),
    enabled: enabled && !!projectId && !!moduleId,
  })
}
