"use client"

import { useState, useEffect, useMemo } from "react"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { debounce } from "lodash"
import { ProjectCard } from "./project-card"
import { FolderKanban, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ProjectListProps {
  searchQuery: string
  showDeleted?: boolean
}

function ProjectCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

export function ProjectList({ searchQuery, showDeleted = false }: ProjectListProps) {
  const { projects, isLoading } = useProjects({ includeDeleted: true })
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)

  const debouncedSetSearchQuery = useMemo(
    () => debounce((query: string) => {
      setDebouncedSearchQuery(query)
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSetSearchQuery(searchQuery)
    return () => {
      debouncedSetSearchQuery.cancel()
    }
  }, [searchQuery, debouncedSetSearchQuery])

  const filteredProjects = useMemo(() => {
    if (!projects) return []
    return projects
      .filter((project) => showDeleted ? project.isDeleted : !project.isDeleted)
      .filter(
        (project) =>
          project.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())),
      )
  }, [projects, debouncedSearchQuery, showDeleted])


  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (filteredProjects.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <FolderKanban className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-4" />
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {showDeleted ? "Không có dự án đã xóa" : "Không có dự án"}
        </span>
        <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-xs">
          {showDeleted
            ? "Chưa có dự án nào bị xóa. Các dự án đã xóa mềm sẽ hiển thị ở đây."
            : searchQuery
              ? "Không tìm thấy dự án phù hợp với tìm kiếm của bạn."
              : "Bắt đầu bằng cách tạo dự án mới để quản lý tài liệu."}
        </p>
      </div>
    )
  }

  return (
    <div className="py-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 flex-1 min-h-0 overflow-y-auto pr-2 pb-4 content-start">
      {filteredProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project as any}
        />
      ))}
    </div>
  )
}
