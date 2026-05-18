"use client"

import { useQuery } from "@tanstack/react-query"
import { getModuleContentCount } from "../project.service"
import cachedKeys from "@/constants/cachedKeys"

export function useModuleContentCount(moduleId: string) {
  return useQuery({
    queryKey: cachedKeys.project.moduleContentCount(moduleId),
    queryFn: () => getModuleContentCount(moduleId),
    enabled: !!moduleId,
  })
}
