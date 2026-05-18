"use client"

import { useModuleContentCount } from "@/modules/project/hooks/useModuleContentCount"

interface ModuleContentCountProps {
  moduleId: string
}

export function ModuleContentCount({ moduleId }: ModuleContentCountProps) {
  const { data, isLoading } = useModuleContentCount(moduleId)

  if (isLoading) {
    return (
      <div className="text-right">
        <div className="text-sm font-medium animate-pulse bg-muted h-4 w-8 rounded"></div>
        <div className="text-xs text-muted-foreground">tài liệu</div>
      </div>
    )
  }

  return (
    <div className="text-right">
      <div className="text-sm font-medium">{data?.count || 0}</div>
      <div className="text-xs text-muted-foreground">tài liệu</div>
    </div>
  )
}
