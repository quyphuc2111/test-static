import { useQuery } from "@tanstack/react-query"
import { getDashboardStats, getRecentActivity } from "../dashboard.service"

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: getRecentActivity,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false
  })
}

export function useDashboard() {
  const statsQuery = useDashboardStats()
  const activityQuery = useRecentActivity()

  return {
    stats: statsQuery.data,
    activity: activityQuery.data,
    isLoading: statsQuery.isLoading || activityQuery.isLoading,
    isError: statsQuery.isError || activityQuery.isError,
    error: statsQuery.error || activityQuery.error,
    refetch: () => {
      statsQuery.refetch()
      activityQuery.refetch()
    }
  }
}
