"use client"

import { Shield, Eye, Download, Edit3, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface EditPermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  permissions: {
    canView: boolean
    canDownload: boolean
    canEdit: boolean
    canDelete: boolean
  }
  onPermissionsChange: (permissions: any) => void
  onConfirm: () => void
  isPending?: boolean
}

export function EditPermissionsDialog({ 
  open, 
  onOpenChange, 
  permissions, 
  onPermissionsChange,
  onConfirm, 
  isPending = false 
}: EditPermissionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            Chỉnh sửa quyền chia sẻ
          </DialogTitle>
          <DialogDescription className="text-sm">
            Thay đổi quyền truy cập cho người dùng này
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canView"
                checked={permissions.canView}
                onCheckedChange={(checked) => 
                  onPermissionsChange({ ...permissions, canView: !!checked })
                }
              />
              <Label htmlFor="canView" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Xem nội dung
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canDownload"
                checked={permissions.canDownload}
                onCheckedChange={(checked) => 
                  onPermissionsChange({ ...permissions, canDownload: !!checked })
                }
              />
              <Label htmlFor="canDownload" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Tải xuống nội dung
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canEdit"
                checked={permissions.canEdit}
                onCheckedChange={(checked) => 
                  onPermissionsChange({ ...permissions, canEdit: !!checked })
                }
              />
              <Label htmlFor="canEdit" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Chỉnh sửa nội dung
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canDelete"
                checked={permissions.canDelete}
                onCheckedChange={(checked) => 
                  onPermissionsChange({ ...permissions, canDelete: !!checked })
                }
              />
              <Label htmlFor="canDelete" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Xóa nội dung
              </Label>
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Lưu ý:</strong> Quyền "Xem" là bắt buộc. Quyền "Tải xuống" cho phép người dùng tải file về máy. Nếu bỏ chọn "Xem", người dùng sẽ không thể truy cập nội dung.
            </p>
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto ">
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending || !permissions.canView}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            {isPending ? "Đang cập nhật..." : "Cập nhật quyền"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

