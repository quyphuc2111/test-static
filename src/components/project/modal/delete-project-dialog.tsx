"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "react-toastify"

interface Project {
  id: string
  name: string
  modules: any[]
}

interface DeleteProjectDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteProjectDialog({ project, open, onOpenChange, onConfirm }: DeleteProjectDialogProps) {

  const handleDelete = async () => {
    try {
      await onConfirm()
      // Chỉ hiển thị toast success khi thực sự thành công
      toast.success(`Dự án "${project.name}" và ${project.modules?.length || 0} module đã được xóa.`)
      onOpenChange(false)
    } catch (error: any) {
      // Hiển thị toast error khi API trả về lỗi (403, 500, etc.)
      const message = error?.response?.data?.message || error?.message || "Xóa dự án thất bại"
      toast.error(message)
      // Không đóng dialog khi có lỗi để user có thể thử lại
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Xác nhận xóa dự án</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa dự án <strong>{project.name}</strong>?
            <br />
            <br />
            Dự án này có <strong>{project.modules?.length || 0} module</strong> và tất cả dữ liệu liên quan sẽ bị xóa vĩnh
            viễn. Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
          >
            Xóa dự án
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
