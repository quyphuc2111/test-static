"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/modules/auth/hooks/useAuth"

type AuthGuardProps = {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return fallback
  if (!isAuthenticated) return fallback
  return children
}

type RoleGuardProps = {
  children: ReactNode
  roles: string[]
  fallback?: ReactNode
}

export function RoleGuard({ children, roles, fallback = null }: RoleGuardProps) {
  const { user, isLoading } = useAuth()
  if (isLoading) return fallback
  const has = user?.roles?.some((r) => roles.includes(typeof r === 'string' ? r : r.name))
  if (!has) return fallback
  return children
}


