import { useQuery } from "@tanstack/react-query"
import { getContentStats } from "../content.service"

export function useContentStats(projectId?: string) {
  return useQuery({
    queryKey: ["content", "stats", projectId],
    queryFn: () => getContentStats(projectId),
    // refetchInterval: (query) => {
    //   const hasProcessing = query.state.data?.processing && query.state.data.processing > 0
    //   return hasProcessing ? 5000 : false
    // },
    refetchIntervalInBackground: true,
  })
}
