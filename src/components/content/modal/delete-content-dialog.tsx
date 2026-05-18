"use client"

import { AlertTriangle, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface DeleteContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: {
    id: string
    title: string
    contentType: string
    fileSize?: number
    status: string
  } | null
  onConfirm: () => void
  isDeleting?: boolean
}

const getContentTypeLabel = (type: string) => {
  switch (type) {
    case "FILE_ZIP_HTML":
      return "HTML"
    case "FILE_ZIP_SCORM":
      return "SCORM"
    default:
      return type
  }
}

const getContentTypeColor = (type: string) => {
  switch (type) {
    case "FILE_ZIP_HTML":
      return "text-blue-400"
    case "FILE_ZIP_SCORM":
      return "text-green-400"
    default:
      return "text-muted-foreground"
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Hoàn thành</Badge>
    case "PROCESSING":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Đang xử lý</Badge>
    case "FAILED":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Thất bại</Badge>
    default:
      return <Badge variant="secondary">Khác</Badge>
  }
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "0 B"
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export function DeleteContentDialog({
  open,
  onOpenChange,
  content,
  onConfirm,
  isDeleting = false
}: DeleteContentDialogProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!content) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Xác nhận xóa nội dung
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning message */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-400">
                  Hành động này không thể hoàn tác!
                </p>
                <p className="text-xs text-muted-foreground">
                  Tất cả dữ liệu và tệp tin liên quan đến nội dung này sẽ bị xóa vĩnh viễn.
                </p>
              </div>
            </div>
          </div>

          {/* Content info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{content.title}</h3>
              <span className={`font-mono text-sm ${getContentTypeColor(content.contentType)}`}>
                {getContentTypeLabel(content.contentType)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Kích thước:</span>
              <span className="text-foreground">{formatFileSize(content.fileSize)}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Trạng thái:</span>
              {getStatusBadge(content.status)}
            </div>
          </div>


          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Đang xóa..." : "Xóa nội dung"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
