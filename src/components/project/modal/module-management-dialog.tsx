"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreVertical, Edit, Trash2, FileText } from "lucide-react"
import { toast } from "react-toastify"
import { useModules } from "@/modules/project/hooks/useModules"
import { useCreateModule } from "@/modules/project/hooks/useCreateModule"
import { useUpdateModule } from "@/modules/project/hooks/useUpdateModule"
import { useDeleteModule } from "@/modules/project/hooks/useDeleteModule"
import type { Project as ProjectType } from "@/modules/project/project.interface"

interface Module {
  id: string
  name: string
  description?: string
  status: "ACTIVE" | "INACTIVE"
  content?: any[]
}

interface Project {
  id: string
  name: string
  modules: Module[]
}

interface ModuleManagementDialogProps {
  project: ProjectType
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModuleManagementDialog({ project, open, onOpenChange }: ModuleManagementDialogProps) {
  const { data: modules, isLoading } = useModules(project.id)
  const createModuleMutation = useCreateModule()
  const updateModuleMutation = useUpdateModule()
  const deleteModuleMutation = useDeleteModule(project.id)
  
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [deletingModule, setDeletingModule] = useState<Module | null>(null)
  const [newModule, setNewModule] = useState({
    name: "",
    description: "",
    status: "ACTIVE",
  })

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newModule.name.trim()) {
      toast.error("Tên module là bắt buộc")
      return
    }

    try {
      await createModuleMutation.mutateAsync({
        projectId: project.id,
        name: newModule.name.trim(),
        description: newModule.description.trim(),
        status: newModule.status as "ACTIVE" | "INACTIVE",
      })

      toast.success(`Module "${newModule.name}" đã được thêm vào dự án.`)

      setIsAddingModule(false)
      setNewModule({ name: "", description: "", status: "ACTIVE" })
    } catch (error: any) {
      const message = error?.response?.data?.message || "Thêm module thất bại"
      toast.error(message)
    }
  }

  const handleEditModule = async (module: Module) => {
    try {
      await updateModuleMutation.mutateAsync({
        projectId: project.id,
        moduleId: module.id,
        name: module.name,
        description: module.description || "",
        status: module.status as "ACTIVE" | "INACTIVE",
      })

      toast.success(`Module "${module.name}" đã được cập nhật.`)

      setEditingModule(null)
    } catch (error: any) {
      const message = error?.response?.data?.message || "Cập nhật module thất bại"
      toast.error(message)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteModuleMutation.mutateAsync({ projectId: project.id, moduleId })
      toast.success("Module đã được xóa.")
      setDeletingModule(null)
    } catch (error: any) {
      const message = error?.response?.data?.message || "Xóa module thất bại"
      toast.error(message)
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "ACTIVE" ? (
      <Badge variant="default">Đang hoạt động</Badge>
    ) : (
      <Badge variant="secondary">Tạm dừng</Badge>
    )
  }

  const projectModules = modules || project.modules || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Quản lý Module - <span className="text-primary">{project.name}</span></DialogTitle>
          <DialogDescription>
            Quản lý các module trong dự án. Hiện có {projectModules.length} module.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
          {!isAddingModule ? (
            <Button onClick={() => setIsAddingModule(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Thêm Module Mới
            </Button>
          ) : (
            <form onSubmit={handleAddModule} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold text-sm">Thêm Module Mới</h4>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="module-name">Tên module *</Label>
                  <Input
                    id="module-name"
                    placeholder="Nhập tên module..."
                    value={newModule.name}
                    onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="module-description">Mô tả</Label>
                  <Textarea
                    id="module-description"
                    placeholder="Mô tả về module..."
                    value={newModule.description}
                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="module-status">Trạng thái</Label>
                  <Select
                    value={newModule.status}
                    onValueChange={(value) => setNewModule({ ...newModule, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                      <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={createModuleMutation.isPending}>
                  {createModuleMutation.isPending ? "Đang thêm..." : "Thêm Module"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingModule(false)
                    setNewModule({ name: "", description: "", status: "ACTIVE" })
                  }}
                >
                  Hủy
                </Button>
              </div>
            </form>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Danh sách Module ({projectModules.length})</h4>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Đang tải...</p>
            ) : projectModules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có module nào</p>
            ) : (
              projectModules.map((module: any) => (
                <div key={module.id} className="p-4 border rounded-lg bg-card space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{module.name}</h5>
                        {getStatusBadge(module.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {module.description || "Không có mô tả"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingModule(module)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingModule(module)} 
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa module
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{module.content?.length || 0} tài liệu</span>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
