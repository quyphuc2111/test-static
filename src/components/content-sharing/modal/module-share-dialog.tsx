"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useUsers } from "@/modules/rbac/hooks"
import { useBulkShareContent } from "@/modules/rbac/hooks/useContentSharing"
import { toast } from "react-toastify"

interface ModuleShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: string
  moduleName: string
}

export function ModuleShareDialog({ open, onOpenChange, moduleId, moduleName }: ModuleShareDialogProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [permission, setPermission] = useState("view")
  
  const { data: users, isLoading: usersLoading } = useUsers()
  const bulkShareMut = useBulkShareContent()

  const handleShare = () => {
    if (!moduleId || selectedUsers.length === 0) return
    const canView = true
    const canDownload = permission === "download" || permission === "edit"
    const canEdit = permission === "edit"
    const canDelete = false // Không cho phép xóa qua module share

    selectedUsers.forEach((uid) => {
      bulkShareMut.mutate(
        { moduleId: parseInt(moduleId), sharedWithId: parseInt(uid), canView, canDownload, canEdit, canDelete },
        {
          onSuccess: () => {
            toast.success(`Đã chia sẻ module`)
            handleClose()
          },
          onError: (e: any) => {
            toast.error(e?.response?.data?.message || e?.message || "Chia sẻ thất bại")
          },
        }
      )
    })
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedUsers([])
    setPermission("view")
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) handleClose()
      else onOpenChange(newOpen)
    }}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl max-h-[90vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-base sm:text-lg">
            Chia sẻ Module: {moduleName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Chọn người dùng</Label>
            <div className="border border-border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {usersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Đang tải người dùng...</span>
                </div>
              ) : (users?.data || []).map((user: any) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers([...selectedUsers, user.id])
                      } else {
                        setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                      }
                    }}
                  />
                  <label
                    htmlFor={`user-${user.id}`}
                    className="flex-1 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name || user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline">User</Badge>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Quyền truy cập</Label>
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger className="bg-muted/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Chỉ xem</SelectItem>
                <SelectItem value="download">Xem và tải xuống</SelectItem>
                <SelectItem value="edit">Xem, tải xuống và chỉnh sửa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Hủy
            </Button>
            <Button 
              onClick={handleShare} 
              disabled={selectedUsers.length === 0 || usersLoading || bulkShareMut.isPending} 
              className="w-full sm:w-auto"
            >
              {bulkShareMut.isPending ? "Đang chia sẻ..." : `Chia sẻ (${selectedUsers.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

