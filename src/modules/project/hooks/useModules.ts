import { useQuery } from "@tanstack/react-query"
import { listModules } from "../project.service"
import cachedKeys from "@/constants/cachedKeys"

export function useModules(projectId: string, enabled = true) {
  return useQuery({
    queryKey: cachedKeys.project.modules(projectId),
    queryFn: () => listModules(projectId),
    enabled,
  })
}