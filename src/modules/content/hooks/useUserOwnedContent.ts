import { useQuery } from "@tanstack/react-query"
import httpService from "@/services/instance"

export interface UserContent {
  id: string
  title: string
  contentType: string
  status: string
  projectId: string
  moduleId: string
  project?: { id: string; name: string }
  module?: { id: string; name: string }
}

async function getUserOwnedContent(userId: string): Promise<UserContent[]> {
  const res = await httpService.get<{ data: UserContent[] }>({
    url: `users/${userId}/content`
  })
  return res.data
}

export function useUserOwnedContent(userId?: string) {
  return useQuery({
    queryKey: ["user-content", userId],
    queryFn: () => getUserOwnedContent(userId!),
    enabled: !!userId,
  })
}

