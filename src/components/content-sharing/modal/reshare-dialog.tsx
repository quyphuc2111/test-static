"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ReshareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
}

export function ReshareDialog({ open, onOpenChange, onConfirm, isPending = false }: ReshareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Xác nhận chia sẻ lại</DialogTitle>
          <DialogDescription className="text-sm">
            Bạn có chắc chắn muốn chia sẻ lại nội dung này không? Người dùng sẽ có thể truy cập lại nội dung.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {isPending ? "Đang chia sẻ..." : "Chia sẻ lại"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

