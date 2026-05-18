import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { getUsers } from "../rbac.service"

interface UseInfiniteUsersOptions {
  search?: string
  pageSize?: number
  enabled?: boolean
}

export function useInfiniteUsers(options: UseInfiniteUsersOptions = {}) {
  const { search = "", pageSize = 20, enabled = true } = options
  const qc = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: ["rbac", "users", "infinite", search, pageSize],
    queryFn: ({ pageParam = 1 }) => 
      getUsers({ 
        page: pageParam, 
        pageSize, 
        search: search.trim() || undefined 
      }),
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage
      return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Flatten all pages data
  const allUsers = query.data?.pages.flatMap(page => page.data) ?? []
  
  // Get pagination info from last page
  const lastPage = query.data?.pages[query.data.pages.length - 1]
  const totalUsers = lastPage?.pagination.total ?? 0
  const hasNextPage = !!query.hasNextPage
  const isFetchingNextPage = query.isFetchingNextPage

  return {
    ...query,
    allUsers,
    totalUsers,
    hasNextPage,
    isFetchingNextPage,
    // Helper methods
    loadMore: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
    // Invalidate cache
    invalidate: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  }
}
