"use client"

import { useQuery } from "@tanstack/react-query"
import { getPermissions } from "../rbac.service"
import cachedKeys from "@/constants/cachedKeys"

export function usePermissions() {
  return useQuery({
    queryKey: cachedKeys.rbac.permissions,
    queryFn: getPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}