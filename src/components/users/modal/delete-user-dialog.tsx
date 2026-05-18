"use client"

import type React from "react"
import { AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUsers } from "@/modules/rbac/hooks/useUsers"
import { toast } from "react-toastify"

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
}

export function DeleteUserDialog({ open, onOpenChange, user }: DeleteUserDialogProps) {
  const { remove } = useUsers()

  const handleDelete = async () => {
    if (!user) return

    try {
      await remove.mutateAsync(user.id)
      toast.success("Xóa người dùng thành công!")
      onOpenChange(false)
    } catch (error) {
      console.error("Delete user error:", error)
      toast.error("Có lỗi xảy ra khi xóa người dùng")
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[400px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-foreground text-base sm:text-lg">Xóa Người dùng</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
                Hành động này không thể hoàn tác
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa người dùng <strong className="text-foreground">{user.name || user.email}</strong>?
          </p>
          
          <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Cảnh báo
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Tất cả dữ liệu liên quan đến người dùng này sẽ bị xóa vĩnh viễn</li>
                    <li>Người dùng sẽ không thể đăng nhập vào hệ thống</li>
                    <li>Hành động này không thể hoàn tác</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Hủy
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={remove.isPending}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
          >
            {remove.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa Người dùng
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
