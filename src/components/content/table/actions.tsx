"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Copy, Check, BookOpen, Edit, Download, Trash2, ExternalLink, RefreshCw } from "lucide-react"

export interface ActionItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  disabled?: boolean
  variant?: "default" | "destructive"
  separator?: boolean
}

interface ActionsProps {
  actions: ActionItem[]
  trigger?: React.ReactNode
  align?: "start" | "center" | "end"
}

export function Actions({ 
  actions, 
  trigger,
  align = "end" 
}: ActionsProps) {
  const defaultTrigger = (
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {actions.map((action, index) => (
          <div key={action.id}>
            {action.separator && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.variant === "destructive" ? "text-red-400" : ""}
            >
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Predefined action sets for common use cases
export const createContentActions = (
  content: any,
  handlers: {
    onView: (content: any) => void
    onCopyUrl: (content: any) => void
    onShowSCORMInfo: (content: any) => void
    onEdit: (content: any) => void
    onDownload: (content: any) => void
    onDelete: (content: any) => void
    onOpenExternal?: (content: any) => void
    onUpdateFile?: (content: any) => void
  },
  state: {
    copiedUrl: string | null
    isDownloading: boolean
    isDeleting: boolean
    isUpdating?: boolean
    hasSCORMInfo: boolean
    hasFile?: boolean
    isOwner?: boolean
  }
): ActionItem[] => {
  const actions: ActionItem[] = [
    {
      id: "view",
      label: "Xem",
      icon: Eye,
      onClick: () => handlers.onView(content)
    },
    {
      id: "copy",
      label: state.copiedUrl === content.id ? "Đã copy!" : "Copy URL",
      icon: state.copiedUrl === content.id ? Check : Copy,
      onClick: () => handlers.onCopyUrl(content)
    }
  ]

  if (state.hasSCORMInfo) {
    actions.push({
      id: "scorm-info",
      label: "Thông tin SCORM",
      icon: BookOpen,
      onClick: () => handlers.onShowSCORMInfo(content)
    })
  }

  if (handlers.onOpenExternal) {
    actions.push({
      id: "external",
      label: "Mở trong tab mới",
      icon: ExternalLink,
      onClick: () => handlers.onOpenExternal!(content)
    })
  }

  actions.push(
    {
      id: "edit",
      label: "Chỉnh sửa",
      icon: Edit,
      onClick: () => handlers.onEdit(content)
    },
    {
      id: "download",
      label: state.isDownloading ? "Đang tải..." : "Tải xuống",
      icon: Download,
      onClick: () => handlers.onDownload(content),
      disabled: state.isDownloading
    }
  )

  // Add update file action if content has file and user is owner
  if (state.hasFile && state.isOwner && handlers.onUpdateFile) {
    actions.push({
      id: "update-file",
      label: state.isUpdating ? "Đang cập nhật..." : "Cập nhật File",
      icon: RefreshCw,
      onClick: () => handlers.onUpdateFile!(content),
      disabled: state.isUpdating
    })
  }

  actions.push(
    {
      id: "delete",
      label: state.isDeleting ? "Đang xóa..." : "Xóa",
      icon: Trash2,
      onClick: () => handlers.onDelete(content),
      disabled: state.isDeleting,
      variant: "destructive",
      separator: true
    }
  )

  return actions
}

// Generic action sets
export const createTableActions = (
  item: any,
  handlers: {
    onView?: (item: any) => void
    onEdit?: (item: any) => void
    onDelete?: (item: any) => void
    onDuplicate?: (item: any) => void
    onArchive?: (item: any) => void
  },
  state: {
    isProcessing?: boolean
  } = {}
): ActionItem[] => {
  const actions: ActionItem[] = []

  if (handlers.onView) {
    actions.push({
      id: "view",
      label: "Xem",
      icon: Eye,
      onClick: () => handlers.onView!(item)
    })
  }

  if (handlers.onEdit) {
    actions.push({
      id: "edit",
      label: "Chỉnh sửa",
      icon: Edit,
      onClick: () => handlers.onEdit!(item)
    })
  }

  if (handlers.onDuplicate) {
    actions.push({
      id: "duplicate",
      label: "Nhân bản",
      icon: Copy,
      onClick: () => handlers.onDuplicate!(item)
    })
  }

  if (handlers.onArchive) {
    actions.push({
      id: "archive",
      label: "Lưu trữ",
      icon: BookOpen,
      onClick: () => handlers.onArchive!(item)
    })
  }

  if (handlers.onDelete) {
    actions.push({
      id: "delete",
      label: state.isProcessing ? "Đang xử lý..." : "Xóa",
      icon: Trash2,
      onClick: () => handlers.onDelete!(item),
      disabled: state.isProcessing,
      variant: "destructive",
      separator: true
    })
  }

  return actions
}
