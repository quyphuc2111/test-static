"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2, FolderKanban } from "lucide-react"
import { ProjectList } from "./project-list"
import { CreateProjectDialog } from "./modal/create-project-dialog"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { Permissions } from "@/constants/permissions"

export function ProjectManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)

  const { projects, isLoading } = useProjects({ includeDeleted: true })

  const activeCount = projects?.filter(p => !p.isDeleted).length ?? 0
  const deletedCount = projects?.filter(p => p.isDeleted).length ?? 0

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dự án</h2>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Đang tải..." : `Quản lý tất cả dự án và module. ${activeCount} dự án đang hoạt động.`}
          </p>
        </div>
        <PermissionGuard permission={Permissions.Project.CREATE}>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto"
            data-testid="project-create-button"
          >
            <Plus className="h-4 w-4" />
            Tạo Dự án Mới
          </Button>
        </PermissionGuard>
      </div>

      {/* Toolbar: tabs + search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <PermissionGuard permission={Permissions.Project.VIEW_DELETED}>
          <Tabs
            value={showDeleted ? "deleted" : "active"}
            onValueChange={(v) => setShowDeleted(v === "deleted")}
            data-testid="project-tabs"
          >
            <TabsList>
              <TabsTrigger value="active" data-testid="tab-active">
                Đang hoạt động
                {activeCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {activeCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="deleted" data-testid="tab-deleted">
                <Trash2 className="h-3 w-3 mr-1.5" />
                Đã xóa
                {deletedCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                    {deletedCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </PermissionGuard>

        <div className="relative w-full sm:w-72" data-testid="project-search-wrapper">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Tìm kiếm dự án..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200"
            data-testid="project-search-input"
          />
        </div>
      </div>

      {/* Project grid */}
      <ProjectList searchQuery={searchQuery} showDeleted={showDeleted} />

      <CreateProjectDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  )
}
