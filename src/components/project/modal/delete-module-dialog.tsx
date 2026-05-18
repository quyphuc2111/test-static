"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDeleteModule } from "@/modules/project/hooks/useDeleteModule"
import { toast } from "react-toastify"
import { AlertTriangle } from "lucide-react"

interface DeleteModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string | null
  module: {
    id: string
    name: string
    _count?: {
      content?: number
    }
  } | null
}

export function DeleteModuleDialog({ open, onOpenChange, projectId, module }: DeleteModuleDialogProps) {
  const deleteMutation = useDeleteModule(projectId || "")
  const contentCount = module?._count?.content || 0

  const handleDelete = async () => {
    if (!module || !projectId) return
    try {
      await deleteMutation.mutateAsync({ projectId, moduleId: module.id })
      toast.success("Xóa module thành công")
      onOpenChange(false)
    } catch (err: any) {
      const message = err?.response?.data?.message || "Xóa module thất bại"
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Xóa module?
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
          Hành động này không thể hoàn tác. Module
          {module ? ` "${module.name}"` : ""} sẽ bị xóa vĩnh viễn.
            {contentCount > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
                <p className="text-destructive font-medium text-sm">
                  ⚠️ Module này chứa {contentCount} tài liệu
                </p>
                <p className="text-xs text-muted-foreground">
                  Bạn cần xóa hết tài liệu trong module trước hoặc sử dụng chức năng "Xóa mềm" để giữ lại dữ liệu có thể khôi phục.
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={deleteMutation.isPending || contentCount > 0}
          >
            {deleteMutation.isPending ? "Đang xoá..." : "Xóa vĩnh viễn"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}



