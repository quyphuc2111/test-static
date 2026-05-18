"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface RevokeShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
  title?: string
  description?: string
}

export function RevokeShareDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  isPending = false,
  title = "Xác nhận thu hồi chia sẻ",
  description = "Bạn có chắc chắn muốn thu hồi quyền chia sẻ này không? Hành động này không thể hoàn tác."
}: RevokeShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{title}</DialogTitle>
          <DialogDescription className="text-sm">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Đang thu hồi..." : "Thu hồi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

