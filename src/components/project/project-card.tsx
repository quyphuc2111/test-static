"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FolderKanban, MoreVertical, Edit, Trash2, Trash, RotateCcw, Layers, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditProjectDialog } from "./modal/edit-project-dialog"
import { ModuleManagementDialog } from "./modal/module-management-dialog"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { Permissions } from "@/constants/permissions"
import {
  useSoftDeleteProject,
  useHardDeleteProject,
  useRestoreProject,
} from "@/modules/project/hooks"
import { toast } from "react-toastify"
import type { Project } from "./table/columns"

interface ProjectCardProps {
  project: Project
  onDelete?: (projectId: string) => void
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [modulesOpen, setModulesOpen] = useState(false)

  const softDeleteMutation = useSoftDeleteProject()
  const hardDeleteMutation = useHardDeleteProject()
  const restoreMutation = useRestoreProject()

  const handleSoftDelete = async () => {
    try {
      await softDeleteMutation.mutateAsync(project.id)
      toast.success("Dự án đã được xóa mềm")
    } catch {
      // Error toast handled by hook onError
    }
  }

  const handleHardDelete = async () => {
    try {
      await hardDeleteMutation.mutateAsync(project.id)
      toast.success("Dự án đã được xóa vĩnh viễn")
    } catch {
      // Error toast handled by hook onError
    }
  }

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(project.id)
      toast.success("Dự án đã được khôi phục")
    } catch {
      // Error toast handled by hook onError
    }
  }

  const moduleCount = project.modules?.length || 0
  const updatedDate = new Date(project.updatedAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  const statusLabel = project.isDeleted ? "Đã xóa" : project.status === "ACTIVE" ? "Hoạt động" : project.status === "INACTIVE" ? "Tạm dừng" : "Lưu trữ"
  const statusClass = project.isDeleted
    ? "bg-red-100 text-red-600 dark:bg-red-900/30"
    : project.status === "ACTIVE"
    ? "bg-green-100 text-green-700 dark:bg-green-900/30"
    : "bg-slate-100 text-slate-500 dark:bg-slate-800"

  return (
    <>
      <div
        className={`bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col group hover:-translate-y-0.5 relative cursor-pointer ${
          project.isDeleted ? "opacity-60" : ""
        }`}
        onClick={() => !project.isDeleted && router.push(`/projects/${project.id}`)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${project.isDeleted ? "bg-red-50 text-red-400 dark:bg-red-900/20" : "bg-blue-50 text-blue-600 dark:bg-blue-900/30"}`}>
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${statusClass}`}>
              {statusLabel}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-white -mr-2 relative z-10"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`project-row-actions-${project.id}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!project.isDeleted ? (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.id}`) }}>
                      <Layers className="mr-2 h-4 w-4" />
                      Xem chi tiết
                    </DropdownMenuItem>
                    <PermissionGuard permission={Permissions.Project.EDIT}>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditOpen(true) }} data-testid="project-action-edit">
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                    </PermissionGuard>
                    <DropdownMenuSeparator />
                    <PermissionGuard permission={Permissions.Project.SOFT_DELETE}>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleSoftDelete() }}
                        className="text-orange-600"
                        data-testid="project-action-soft-delete"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa mềm
                      </DropdownMenuItem>
                    </PermissionGuard>
                    <PermissionGuard permission={Permissions.Project.HARD_DELETE}>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleHardDelete() }}
                        className="text-destructive"
                        data-testid="project-action-hard-delete"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Xóa vĩnh viễn
                      </DropdownMenuItem>
                    </PermissionGuard>
                  </>
                ) : (
                  <>
                    <PermissionGuard permission={Permissions.Project.RESTORE}>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleRestore() }}
                        className="text-green-600"
                        data-testid="project-action-restore"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Khôi phục
                      </DropdownMenuItem>
                    </PermissionGuard>
                    <PermissionGuard permission={Permissions.Project.HARD_DELETE}>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleHardDelete() }}
                        className="text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Xóa vĩnh viễn
                      </DropdownMenuItem>
                    </PermissionGuard>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className={`font-semibold text-base text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${project.isDeleted ? "line-through text-muted-foreground" : ""}`}>
          {project.name}
        </h3>

        <p className="text-sm text-slate-500 mb-5 line-clamp-2 flex-1">
          {project.description || "Chưa có mô tả"}
        </p>

        <div className="flex items-center justify-between text-xs font-medium text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
            <Layers className="h-3 w-3" />
            {moduleCount} Module
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="h-3 w-3" />
            {updatedDate}
          </span>
        </div>
      </div>

      {editOpen && (
        <EditProjectDialog
          project={project as any}
          open={editOpen}
          onOpenChange={(open) => !open && setEditOpen(false)}
        />
      )}

      {modulesOpen && (
        <ModuleManagementDialog
          project={project as any}
          open={modulesOpen}
          onOpenChange={(open) => !open && setModulesOpen(false)}
        />
      )}
    </>
  )
}
