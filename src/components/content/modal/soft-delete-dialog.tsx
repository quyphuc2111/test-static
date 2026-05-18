import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { ContentItem } from "@/components/content/table"

interface SoftDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: ContentItem | null
  onConfirm: () => void
  isDeleting?: boolean
}

export function SoftDeleteDialog({
  open,
  onOpenChange,
  content,
  onConfirm,
  isDeleting = false
}: SoftDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-amber-100">
              <Trash2 className="h-4.5 w-4.5 text-amber-600" />
            </div>
            Chuyển vào thùng rác?
          </DialogTitle>
          <DialogDescription className="pt-3 text-slate-600">
            Bạn có chắc chắn muốn chuyển nội dung{" "}
            <span className="font-semibold text-slate-900">"{content?.title}"</span>{" "}
            vào thùng rác?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-1">
          <p className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
            <span className="shrink-0">ℹ️</span>
            <span>Nội dung sẽ được lưu trữ trong thùng rác và có thể khôi phục sau này.</span>
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
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isDeleting ? "Đang xóa..." : "Chuyển vào thùng rác"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
