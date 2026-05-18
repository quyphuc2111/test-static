import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import type { ContentItem } from "@/components/content/table"

interface HardDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: ContentItem | null
  onConfirm: () => void
  isDeleting?: boolean
}

export function HardDeleteDialog({
  open,
  onOpenChange,
  content,
  onConfirm,
  isDeleting = false
}: HardDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-red-100">
              <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
            </div>
            Xóa vĩnh viễn nội dung?
          </DialogTitle>
          <DialogDescription className="pt-3 text-slate-600">
            Bạn có chắc chắn muốn{" "}
            <span className="font-semibold text-red-600">XÓA VĨNH VIỄN</span>{" "}
            nội dung{" "}
            <span className="font-semibold text-slate-900">"{content?.title}"</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-1">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium flex items-start gap-2">
            <span className="shrink-0">⚠️</span>
            <span>Hành động này không thể hoàn tác!</span>
          </p>
          <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1 ml-6">
            Tất cả dữ liệu và file liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống.
          </p>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
