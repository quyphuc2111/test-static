"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Eye, Copy, Check, BookOpen, Edit, Download, Trash2, RotateCcw, Upload, Link, RefreshCw, Calendar, FileText } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from "react"
import { useUserPermissions } from "@/modules/rbac/hooks"
import { PermissionName } from "@prisma/client"
import { calculateContentPermissions, ContentPermissions } from "./permissions"

// Types
export interface ContentItem {
  id: string
  title: string
  description?: any
  contentType: string
  fileSize?: number
  status: string
  progress?: number
  createdAt: string
  contentUrl: string
  isDeleted?: boolean
  owner?: { id: string; username?: string; name?: string | null; email?: string | null } | null
  isShared?: boolean
  sharePermissions?: {
    canView: boolean
    canDownload: boolean
    canEdit: boolean
    canDelete: boolean
  } | null
}

// Utility functions
const formatFileSize = (bytes?: number) => {
  if (!bytes) return "0 B"
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
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

const getStatusBadge = (status: string, progress?: number) => {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Hoàn thành</Badge>
    case "PROCESSING":
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Đang xử lý</Badge>
          {/* {progress !== undefined && (
            <div className="flex items-center gap-1">
              <div className="w-8 bg-muted rounded-full h-1.5">
                <div 
                  className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-blue-400 font-medium">{progress}%</span>
            </div>
          )} */}
        </div>
      )
    case "UPLOADING":
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">Đang tải lên</Badge>
          {progress !== undefined && progress > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-12 bg-muted rounded-full h-1.5">
                <div
                  className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-amber-400 font-medium">{progress}%</span>
            </div>
          )}
        </div>
      )
    case "FAILED":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Thất bại</Badge>
    default:
      return <Badge variant="secondary">Khác</Badge>
  }
}

const truncateText = (text: string, maxLength: number = 50) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatJsonValue = (value: any) => {
  if (typeof value === 'object' && value !== null) {
    if (value.title) {
      return `"${truncateText(value.title, 25)}" (v${value.version || 'N/A'})`
    }
    const entries = Object.entries(value).slice(0, 2)
    return entries.map(([k, v]) => {
      const val = String(v)
      // Đặc biệt xử lý cho launchFile với đường dẫn dài
      if (k === 'launchFile' && val.includes('/') || val.includes('\\')) {
        const fileName = val.split('/').pop()?.split('\\').pop() || val
        return `${k}: ${truncateText(fileName, 15)}`
      }
      return `${k}: ${truncateText(val, 15)}`
    }).join(', ')
  }
  return truncateText(String(value), 30)
}

const getSCORMInfo = (content: ContentItem) => {
  if (content.contentType === "FILE_ZIP_SCORM" && content.description) {
    const desc = content.description
    if (typeof desc === 'object' && desc) return desc.scorm || null
    try {
      const parsed = JSON.parse(desc)
      return parsed.scorm || null
    } catch {
      return null
    }
  }
  return null
}

// Action component
interface ContentActionsProps {
  content: ContentItem
  onView: (content: ContentItem) => void
  onCopyUrl: (content: ContentItem) => void
  onShowSCORMInfo: (content: ContentItem) => void
  onEdit: (content: ContentItem) => void
  onDownload: (content: ContentItem) => void
  onRestore: (content: ContentItem) => void
  onUploadFile?: (content: ContentItem) => void
  onUpdateFile?: (content: ContentItem) => void
  onSoftDelete?: (content: ContentItem) => void
  onHardDelete?: (content: ContentItem) => void
  copiedUrl: string | null
  isDownloading: boolean
  isRestoring: boolean
  isUploading?: boolean
  isUpdating?: boolean
  isSoftDeleting?: boolean
  isHardDeleting?: boolean
  currentUserId?: string
}

function ContentActions({
  content,
  onView,
  onCopyUrl,
  onShowSCORMInfo,
  onEdit,
  onDownload,
  onRestore,
  onUploadFile,
  onUpdateFile,
  onSoftDelete,
  onHardDelete,
  copiedUrl,
  isDownloading,
  isRestoring,
  isUploading,
  isUpdating,
  isSoftDeleting,
  isHardDeleting,
  currentUserId
}: ContentActionsProps) {
  const userPermissions = useUserPermissions()
  
  // Calculate permissions using shared utility
  const perms = calculateContentPermissions(content, currentUserId, userPermissions)
  const { isDeleted } = perms

  // If content is deleted, show restore action instead
  if (isDeleted) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {perms.canRestore && (
            <DropdownMenuItem 
              onClick={() => onRestore(content)}
              disabled={isRestoring}
              className="text-green-400"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isRestoring ? "Đang khôi phục..." : "Khôi phục"}
            </DropdownMenuItem>
          )}
          {perms.canHardDelete && onHardDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onHardDelete(content)}
                disabled={isHardDeleting}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isHardDeleting ? "Đang xóa cứng..." : "Xóa vĩnh viễn"}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onView(content)}>
            <Eye className="mr-2 h-4 w-4" />
            Xem chi tiết
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {perms.canView && (
          <>
            <DropdownMenuItem onClick={() => onView(content)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem
            </DropdownMenuItem>
            {perms.canCopyUrl && (
              <DropdownMenuItem onClick={() => onCopyUrl(content)}>
                {copiedUrl === content.id ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-400" />
                    <span className="text-green-400">Đã copy!</span>
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </>
                )}
              </DropdownMenuItem>
            )}
            {getSCORMInfo(content) && (
              <DropdownMenuItem onClick={() => onShowSCORMInfo(content)}>
                <BookOpen className="mr-2 h-4 w-4" />
                Thông tin SCORM
              </DropdownMenuItem>
            )}
          </>
        )}
        {perms.canDownload && (
          <DropdownMenuItem 
            onClick={() => onDownload(content)}
            disabled={isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Đang tải..." : "Tải xuống"}
          </DropdownMenuItem>
        )}
        {perms.canEdit && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(content)}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            {perms.canUpdate && onUpdateFile && (
              <DropdownMenuItem 
                onClick={() => onUpdateFile(content)}
                disabled={isUpdating}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {isUpdating ? "Đang cập nhật..." : "Cập nhật File"}
              </DropdownMenuItem>
            )}
          </>
        )}
        {perms.canSoftDelete && onSoftDelete && (
          <DropdownMenuItem 
            onClick={() => onSoftDelete(content)}
            disabled={isSoftDeleting}
            className="text-orange-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isSoftDeleting ? "Đang xóa mềm..." : "Xóa mềm"}
          </DropdownMenuItem>
        )}
        {perms.canHardDelete && onHardDelete && (
          <DropdownMenuItem 
            onClick={() => onHardDelete(content)}
            disabled={isHardDeleting}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isHardDeleting ? "Đang xóa cứng..." : "Xóa vĩnh viễn"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Description component
interface ContentDescriptionProps {
  content: ContentItem
  onDescriptionClick: (content: ContentItem) => void
}

function ContentDescription({ content, onDescriptionClick }: ContentDescriptionProps) {
  if (!content.description) return <span className="text-muted-foreground">-</span>
  
  const desc = content.description
  if (typeof desc === 'object' && desc) {
    const entries = Object.entries(desc)
    if (entries.length === 0) return <span className="text-muted-foreground">-</span>
    
    return (
      <div 
        className="space-y-1 max-w-full cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
        onClick={() => onDescriptionClick(content)}
      >
        {entries.slice(0, 2).map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 text-xs">
            <span className="font-medium text-muted-foreground min-w-0 flex-shrink-0">
              {key}:
            </span>
            <span className="text-foreground truncate min-w-0 flex-1">
              {formatJsonValue(value)}
            </span>
          </div>
        ))}
        {entries.length > 2 && (
          <div className="text-xs text-muted-foreground">
            +{entries.length - 2} trường khác
          </div>
        )}
      </div>
    )
  }
  
  return (
    <span 
      className="text-foreground text-xs cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors block max-w-full truncate"
      onClick={() => onDescriptionClick(content)}
    >
      {truncateText(String(desc), 50)}
    </span>
  )
}

// Progress component
interface ContentProgressProps {
  content: ContentItem
}

function ContentProgress({ content }: ContentProgressProps) {
  if (content.progress === undefined || content.progress === null) {
    return <span className="text-sm">-</span>
  }

  return (
    <div className="flex items-center gap-2 w-full">
      {/* <div className="flex-1 bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ease-out ${
            content.status === "COMPLETED" 
              ? "bg-green-400" 
              : content.status === "FAILED"
              ? "bg-red-400"
              : "bg-blue-400"
          }`}
          style={{ width: `${content.progress}%` }}
        />
      </div> */}
      <span className={`text-xs font-medium min-w-[3rem] text-right ${
        content.status === "COMPLETED" 
          ? "text-green-400" 
          : content.status === "FAILED"
          ? "text-red-400"
          : "text-blue-400"
      }`}>
        {content.progress}%
      </span>
    </div>
  )
}

// Column definitions
export const createContentColumns = (
  actions: {
    onView: (content: ContentItem) => void
    onCopyUrl: (content: ContentItem) => void
    onShowSCORMInfo: (content: ContentItem) => void
    onEdit: (content: ContentItem) => void
    onDownload: (content: ContentItem) => void
    onRestore: (content: ContentItem) => void
    onDescriptionClick: (content: ContentItem) => void
    onUploadFile?: (content: ContentItem) => void
    onUpdateFile?: (content: ContentItem) => void
    onSoftDelete?: (content: ContentItem) => void
    onHardDelete?: (content: ContentItem) => void
    copiedUrl: string | null
    isDownloading: boolean
    isRestoring: boolean
    isUploading?: boolean
    isUpdating?: boolean
    isSoftDeleting?: boolean
    isHardDeleting?: boolean
  },
  options?: { isAdmin?: boolean; currentUserId?: string }
): ColumnDef<ContentItem>[] => [
  {
    id: "index",
    header: "#",
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table?.getState().pagination
      const rowIndex = table?.getRowModel()?.rows.findIndex(r => r.id === row.id)
      const index = pageIndex * pageSize + rowIndex + 1
      return (
        <div className="text-xs text-muted-foreground font-medium w-8">
          {index}
        </div>
      )
    },
    size: 50,
    minSize: 40,
    maxSize: 60,
    enableSorting: false,
  },
  {
    accessorKey: "title",
    header: "Tên Nội dung",
    cell: ({ row }) => {
      const isDeleted = row.original.isDeleted
      const isShared = row.original.isShared
      const contentType = row.original.contentType
      return (
        <div className="flex flex-col gap-1 max-w-full min-w-[200px]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground break-words min-w-0 flex-1">{row.getValue("title")}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className={`text-xs ${getContentTypeColor(contentType)}`}>
              {getContentTypeLabel(contentType)}
            </Badge>
            {isShared && (
              <Badge variant="outline" className="text-xs text-purple-400">Shared</Badge>
            )}
            {isDeleted && (
              <Badge variant="outline" className="text-xs text-amber-400">Deleted</Badge>
            )}
          </div>
        </div>
      )
    },
    size: 300,
    minSize: 200,
    maxSize: 400,
  },
  {
    accessorKey: "contentUrl",
    header: "Đường dẫn",
    cell: ({ row, table }) => {
      const contentUrl = row.getValue("contentUrl") as string
      const hasFile = contentUrl && contentUrl.trim() !== ""
      const content = row.original
      
      if (!hasFile) {
        return (
          <div className="flex items-center">
            {actions.onUploadFile ? (
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => actions.onUploadFile!(content)}
                disabled={actions.isUploading}
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground italic">No file</span>
            )}
          </div>
        )
      }
      
      return (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 max-w-[180px] min-w-[120px] cursor-help">
                <Link className="h-3 w-3 text-green-400 flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">
                  {(() => {
                    const fileName = contentUrl.split('/').pop() || ''
                    const maxLength = 20
                    if (fileName.length <= maxLength) return fileName
                    return fileName.substring(0, maxLength - 3) + '...'
                  })()}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-md bg-popover border-border">
              <p className="text-xs font-mono break-all text-foreground">{contentUrl}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
    size: 180,
    minSize: 120,
    maxSize: 200,
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => (
      <div className="max-w-[200px] min-w-[150px]">
        <ContentDescription 
          content={row.original} 
          onDescriptionClick={actions.onDescriptionClick}
        />
      </div>
    ),
    size: 200,
    minSize: 150,
    maxSize: 250,
  },
  {
    id: "info",
    header: "Kích thước / Ngày tạo",
    cell: ({ row }) => {
      const fileSize = row.original.fileSize
      const createdAt = row.original.createdAt
      const date = new Date(createdAt)
      
      return (
        <div className="flex flex-col gap-1 text-xs min-w-[120px] max-w-[150px]">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium text-foreground">{formatFileSize(fileSize)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground whitespace-nowrap">
              {date.toLocaleDateString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit' 
              })}
              {' '}
              {date.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      )
    },
    size: 140,
    minSize: 120,
    maxSize: 160,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const progress = row.original.progress
      
      return (
        <div className="flex flex-col gap-1">
          {getStatusBadge(status, progress)}
          {status === "PROCESSING" && progress !== undefined && (
            <div className="flex items-center gap-1">
              <div className="w-16 bg-muted rounded-full h-1">
                <div 
                  className="bg-blue-400 h-1 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-blue-400">{progress}%</span>
            </div>
          )}
        </div>
      )
    },
    size: 130,
    minSize: 100,
    maxSize: 150,
  },
  {
    id: "owner",
    header: "Người tạo",
    cell: ({ row }) => {
      const owner = row.original.owner
      if (!owner) return <span className="text-xs text-muted-foreground italic">Không có người tạo</span>
      
      const displayName = owner.name || owner.username || owner.email || 'Unknown'
      const displaySub = owner.username ? `@${owner.username}` : owner.email
      
      return (
        <div className="flex items-center gap-2 max-w-[200px] min-w-[150px]">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium text-foreground truncate" title={displayName}>
              {displayName}
            </span>
            {displaySub && (
              <span className="text-xs text-muted-foreground truncate" title={displaySub}>
                {displaySub}
              </span>
            )}
          </div>
        </div>
      )
    },
    size: 180,
    minSize: 150,
    maxSize: 220,
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => (
      <ContentActions
        content={row.original}
        onView={actions.onView}
        onCopyUrl={actions.onCopyUrl}
        onShowSCORMInfo={actions.onShowSCORMInfo}
        onEdit={actions.onEdit}
        onDownload={actions.onDownload}
        onRestore={actions.onRestore}
        onUploadFile={actions.onUploadFile}
        onUpdateFile={actions.onUpdateFile}
          onSoftDelete={actions.onSoftDelete}
          onHardDelete={actions.onHardDelete}
        copiedUrl={actions.copiedUrl}
        isDownloading={actions.isDownloading}
        isRestoring={actions.isRestoring}
        isUploading={actions.isUploading}
        isUpdating={actions.isUpdating}
          isSoftDeleting={actions.isSoftDeleting}
          isHardDeleting={actions.isHardDeleting}
        currentUserId={options?.currentUserId}
      />
    ),
    size: 90,
    minSize: 80,
    maxSize: 100,
  },
]
