"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useShareContent, useUsers, useBulkShareContent } from "@/modules/rbac/hooks"
import { useContent } from "@/modules/content/hooks/useContent"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { useModules } from "@/modules/project/hooks/useModules"
import { toast } from "react-toastify"
import { Search, User, FileText } from "lucide-react"
import { useAuth } from "@/modules/auth/hooks/useAuth"

interface ShareContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareContentDialog({ open, onOpenChange }: ShareContentDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [selectedModuleId, setSelectedModuleId] = useState("")
  const [selectedContentId, setSelectedContentId] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [canView, setCanView] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [shareScope, setShareScope] = useState<'single' | 'project' | 'module' | 'owner'>("single")
  const [ownerUserId, setOwnerUserId] = useState("")

  const { data: users, isLoading: usersLoading } = useUsers()
  const { projects, isLoading: projectsLoading } = useProjects()
  const { data: modules, isLoading: modulesLoading } = useModules(selectedProjectId, !!selectedProjectId)
  const { data: content, isLoading: contentLoading } = useContent(selectedProjectId, selectedModuleId, !!selectedProjectId && !!selectedModuleId)
  const shareContentMut = useShareContent()
  const bulkShareMut = useBulkShareContent()
  const { user: me } = useAuth()
  const isAdmin = !!me?.roles?.some(r => r.name === "ADMINISTRATOR")

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedProjectId("")
      setSelectedModuleId("")
      setSelectedContentId("")
      setSelectedUserId("")
      setCanView(true)
      setCanEdit(false)
      setCanDelete(false)
      setSearchTerm("")
      setShareScope("single")
      setOwnerUserId("")
    }
  }, [open])

  const filteredUsers = users?.data?.filter((user: any) => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      toast.error("Vui lòng chọn người dùng")
      return
    }

    if (isAdmin && shareScope !== 'single') {
      if (shareScope === 'project' && !selectedProjectId) {
        toast.error("Vui lòng chọn dự án")
        return
      }
      if (shareScope === 'module' && (!selectedProjectId || !selectedModuleId)) {
        toast.error("Vui lòng chọn dự án và module")
        return
      }
      if (shareScope === 'owner' && !ownerUserId) {
        toast.error("Vui lòng chọn người tạo (owner)")
        return
      }

      const payload: any = {
        sharedWithId: Number(selectedUserId) as any,
        canView,
        canEdit,
        canDelete,
      }
      if (shareScope === 'project') payload.projectId = selectedProjectId
      if (shareScope === 'module') {
        payload.projectId = selectedProjectId
        payload.moduleId = selectedModuleId
      }
      if (shareScope === 'owner') payload.ownerId = ownerUserId

      bulkShareMut.mutate(payload, {
        onSuccess: () => {
          toast.success("Chia sẻ hàng loạt thành công")
          onOpenChange(false)
        },
        onError: (error: any) => {
          toast.error(error.message || "Chia sẻ thất bại")
        },
      })
      return
    }

    if (!selectedContentId) {
      toast.error("Vui lòng chọn nội dung")
      return
    }

    shareContentMut.mutate(
      {
        contentId: Number(selectedContentId) as any,
        sharedWithId: Number(selectedUserId) as any,
        canView,
        canEdit,
        canDelete,
      },
      {
        onSuccess: () => {
          toast.success("Chia sẻ nội dung thành công")
          onOpenChange(false)
        },
        onError: (error: any) => {
          toast.error(error.message || "Chia sẻ nội dung thất bại")
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chia sẻ Nội dung</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isAdmin && (
            <div className="space-y-2">
              <Label>Phạm vi chia sẻ</Label>
              <Select value={shareScope} onValueChange={(v) => setShareScope(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phạm vi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Một nội dung</SelectItem>
                  <SelectItem value="project">Toàn bộ dự án</SelectItem>
                  <SelectItem value="module">Toàn bộ module</SelectItem>
                  <SelectItem value="owner">Toàn bộ nội dung của 1 người tạo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Content Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Chọn nội dung</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dự án</Label>
                <Select value={selectedProjectId} onValueChange={(value) => { setSelectedProjectId(value); setSelectedModuleId(""); setSelectedContentId("") }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dự án" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectsLoading ? (
                      <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                    ) : projects && projects.length > 0 ? (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-projects" disabled>Không có dự án nào</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={selectedModuleId} onValueChange={(value) => { setSelectedModuleId(value); setSelectedContentId("") }} disabled={!selectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modulesLoading ? (
                      <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                    ) : modules && modules.length > 0 ? (
                      modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-modules" disabled>Không có module nào</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(!isAdmin || shareScope === 'single') && (
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Select value={selectedContentId} onValueChange={setSelectedContentId} disabled={!selectedModuleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nội dung" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentLoading ? (
                      <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                    ) : content && content.length > 0 ? (
                      content.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-content" disabled>Không có nội dung nào</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* User Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Chọn người dùng</h3>
            
            <div className="space-y-2">
              <Label>Tìm kiếm người dùng</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Người dùng</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn người dùng" />
                </SelectTrigger>
                <SelectContent>
                  {usersLoading ? (
                    <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{user.name || user.email}</span>
                          {user.name && (
                            <span className="text-muted-foreground">({user.email})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-users" disabled>Không có người dùng nào</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {isAdmin && shareScope === 'owner' && (
              <div className="space-y-2">
                <Label>Người tạo (Owner)</Label>
                <Select value={ownerUserId} onValueChange={setOwnerUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn người tạo" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersLoading ? (
                      <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{user.name || user.email}</span>
                            {user.name && (
                              <span className="text-muted-foreground">({user.email})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-users" disabled>Không có người dùng nào</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quyền hạn</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canView"
                  checked={canView}
                  onCheckedChange={(checked) => setCanView(checked as boolean)}
                />
                <Label htmlFor="canView" className="text-sm font-normal cursor-pointer">
                  Xem nội dung
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canEdit"
                  checked={canEdit}
                  onCheckedChange={(checked) => setCanEdit(checked as boolean)}
                />
                <Label htmlFor="canEdit" className="text-sm font-normal cursor-pointer">
                  Chỉnh sửa nội dung
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canDelete"
                  checked={canDelete}
                  onCheckedChange={(checked) => setCanDelete(checked as boolean)}
                />
                <Label htmlFor="canDelete" className="text-sm font-normal cursor-pointer">
                  Xóa nội dung
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={
                (isAdmin && shareScope !== 'single')
                  ? bulkShareMut.isPending || !selectedUserId || (shareScope === 'project' && !selectedProjectId) || (shareScope === 'module' && (!selectedProjectId || !selectedModuleId)) || (shareScope === 'owner' && !ownerUserId)
                  : shareContentMut.isPending || !selectedContentId || !selectedUserId
              }
            >
              {(isAdmin && shareScope !== 'single')
                ? (bulkShareMut.isPending ? "Đang chia sẻ..." : "Chia sẻ hàng loạt")
                : (shareContentMut.isPending ? "Đang chia sẻ..." : "Chia sẻ")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
