"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useInfiniteUsers } from "@/modules/rbac/hooks"
import { useBulkShareContent } from "@/modules/rbac/hooks/useContentSharing"
import { toast } from "react-toastify"

interface ProjectShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
}

export function ProjectShareDialog({ open, onOpenChange, projectId, projectName }: ProjectShareDialogProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [permission, setPermission] = useState("view")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  
  const userListRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const { 
    allUsers, 
    isLoading: usersLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    loadMore,
    totalUsers 
  } = useInfiniteUsers({ 
    search: userSearchTerm,
    enabled: open 
  })
  const bulkShareMut = useBulkShareContent()

  const lastUserElementRef = useCallback((node: HTMLDivElement | null) => {
    if (usersLoading || isFetchingNextPage) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        loadMore()
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [usersLoading, isFetchingNextPage, hasNextPage, loadMore])

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  const handleShare = () => {
    if (!projectId || selectedUsers.length === 0) return
    const canView = true
    const canDownload = permission === "download" || permission === "edit"
    const canEdit = permission === "edit"
    const canDelete = false // Không cho phép xóa qua project share

    selectedUsers.forEach((uid) => {
      bulkShareMut.mutate(
        { projectId: parseInt(projectId), sharedWithId: parseInt(uid), canView, canDownload, canEdit, canDelete },
        {
          onSuccess: () => {
            toast.success(`Đã chia sẻ dự án`)
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
    setUserSearchTerm("")
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
            Chia sẻ Dự án: {projectName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Chọn người dùng</Label>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50 border-border"
              />
            </div>

            <div 
              ref={userListRef}
              className="border border-border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2"
            >
              {usersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Đang tải người dùng...</span>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {userSearchTerm ? "Không tìm thấy người dùng nào" : "Không có người dùng nào"}
                </div>
              ) : (
                <>
                  {allUsers.map((user: any, index: number) => (
                    <div 
                      key={user.id} 
                      className="flex items-center space-x-2"
                      ref={index === allUsers.length - 1 ? lastUserElementRef : null}
                    >
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
                          <p className="text-sm font-medium text-foreground">{user.name || user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="outline">User</Badge>
                      </label>
                    </div>
                  ))}
                  
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-xs text-muted-foreground">Đang tải thêm...</span>
                    </div>
                  )}
                  
                  {totalUsers > 0 && (
                    <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                      Hiển thị {allUsers.length} / {totalUsers} người dùng
                    </div>
                  )}
                </>
              )}
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

