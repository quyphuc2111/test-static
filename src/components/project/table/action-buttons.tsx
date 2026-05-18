"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash2, Eye, Plus, RotateCcw, Trash } from "lucide-react"
import { EditProjectDialog } from "../modal/edit-project-dialog"
import { DeleteProjectDialog } from "../modal/delete-project-dialog"
import { ModuleManagementDialog } from "../modal/module-management-dialog"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { PermissionName } from "@prisma/client"
import { Project } from "./columns"
import { Permissions } from "@/constants/permissions"
import {
  useSoftDeleteProject,
  useHardDeleteProject,
  useRestoreProject,
} from "@/modules/project/hooks"
import { toast } from "react-toastify"

interface ActionButtonsProps {
  project: Project
  onDelete?: (projectId: string) => void
}

export function ActionButtons({ project, onDelete }: ActionButtonsProps) {
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [managingModules, setManagingModules] = useState<Project | null>(null)

  const softDeleteMutation = useSoftDeleteProject()
  const hardDeleteMutation = useHardDeleteProject()
  const restoreMutation = useRestoreProject()

  const handleSoftDelete = async () => {
    try {
      await softDeleteMutation.mutateAsync(project.id)
      toast.success("Dự án đã được xóa mềm thành công")
      setDeletingProject(null)
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa mềm dự án")
    }
  }

  const handleHardDelete = async () => {
    try {
      await hardDeleteMutation.mutateAsync(project.id)
      toast.success("Dự án đã được xóa vĩnh viễn thành công")
      if (onDelete) onDelete(project.id)
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa vĩnh viễn dự án")
    }
  }

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(project.id)
      toast.success("Dự án đã được khôi phục thành công")
    } catch (error: any) {
      toast.error(error.message || "Không thể khôi phục dự án")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            data-testid={`project-row-actions-${project.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {!project.isDeleted ? (
            <>
              <DropdownMenuItem onClick={() => setManagingModules(project)}>
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setManagingModules(project)}>
                <Plus className="mr-2 h-4 w-4" />
                Quản lý Module
              </DropdownMenuItem>
              
              <PermissionGuard permission={Permissions.Project.EDIT}>
              <DropdownMenuItem onClick={() => setEditingProject(project)} data-testid="project-action-edit">
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
              </PermissionGuard>
              
              <DropdownMenuSeparator />
              
              <PermissionGuard permission={Permissions.Project.SOFT_DELETE}>
                <DropdownMenuItem onClick={handleSoftDelete} className="text-orange-600" data-testid="project-action-soft-delete">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa mềm
                </DropdownMenuItem>
              </PermissionGuard>
              
              <PermissionGuard permission={Permissions.Project.HARD_DELETE}>
                <DropdownMenuItem onClick={handleHardDelete} className="text-destructive" data-testid="project-action-hard-delete">
                  <Trash className="mr-2 h-4 w-4" />
                  Xóa vĩnh viễn
                </DropdownMenuItem>
              </PermissionGuard>
            </>
          ) : (
            <>
              <PermissionGuard permission={Permissions.Project.RESTORE}>
                <DropdownMenuItem onClick={handleRestore} className="text-green-600" data-testid="project-action-restore">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Khôi phục
                </DropdownMenuItem>
              </PermissionGuard>
              
              <PermissionGuard permission={Permissions.Project.HARD_DELETE}>
                <DropdownMenuItem onClick={handleHardDelete} className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Xóa vĩnh viễn
                </DropdownMenuItem>
              </PermissionGuard>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {editingProject && (
        <EditProjectDialog
          project={editingProject as any}
          open={!!editingProject}
          onOpenChange={(open: boolean) => !open && setEditingProject(null)}
        />
      )}



      {managingModules && (
        <ModuleManagementDialog
          project={managingModules as any}
          open={!!managingModules}
          onOpenChange={(open: boolean) => !open && setManagingModules(null)}
        />
      )}
    </>
  )
}
