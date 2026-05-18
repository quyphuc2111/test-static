"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getMe, getMeOptional, login, logout } from "../auth.service"
import type { LoginPayload } from "../auth.interface"
import cachedKeys from "@/constants/cachedKeys"

export function useAuth(optionalOnLoginPage: boolean = false) {
  const qc = useQueryClient()
  const meQuery = useQuery({
    queryKey: cachedKeys.auth.me,
    queryFn: optionalOnLoginPage ? getMeOptional : getMe,
    staleTime: 5 * 60 * 1000,
  })

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: cachedKeys.auth.me }),
  })

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      qc.clear()
      window.location.href = '/login'
    },
  })

  return {
    user: meQuery.data,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  }
}


