"use client"

import { useState, useEffect, useRef } from "react"
import { MoreVertical, RotateCcw, Edit3, Trash2, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ShareItem {
  id: string
  content?: {
    title?: string
    project?: { name?: string }
    module?: { name?: string }
  }
  sharedBy?: {
    name?: string
    email?: string
  }
  sharedWith?: {
    name?: string
    email?: string
  }
  status?: string
  canView?: boolean
  canDownload?: boolean
  canEdit?: boolean
  canDelete?: boolean
  createdAt?: string | Date
}

interface SharingHistoryTableProps {
  shares: ShareItem[]
  isLoading?: boolean
  onReshare?: (item: ShareItem) => void
  onEdit?: (item: ShareItem) => void
  onRevoke?: (item: ShareItem) => void
}

const getTypeBadge = (type?: string) => {
  switch ((type || '').toLowerCase()) {
    case "project":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Dự án</Badge>
    case "module":
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Module</Badge>
    case "owner":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Owner</Badge>
    case "list":
      return <Badge variant="secondary">Danh sách</Badge>
    default:
      return <Badge variant="secondary">Khác</Badge>
  }
}

const getPermissionBadges = (share: ShareItem) => {
  const items: any[] = []
  if (share?.canView) items.push(<Badge key="v" variant="outline">Xem</Badge>)
  if (share?.canDownload) items.push(<Badge key="dl" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Tải xuống</Badge>)
  if (share?.canEdit) items.push(<Badge key="e" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Sửa</Badge>)
  if (share?.canDelete) items.push(<Badge key="d" className="bg-red-500/20 text-red-400 border-red-500/30">Xóa</Badge>)
  return <div className="flex gap-1 flex-wrap">{items}</div>
}

export function SharingHistoryTable({ 
  shares, 
  isLoading, 
  onReshare, 
  onEdit, 
  onRevoke 
}: SharingHistoryTableProps) {
  const [showScrollHint, setShowScrollHint] = useState(true)
  const [canScroll, setCanScroll] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current
        setCanScroll(scrollWidth > clientWidth)
      }
    }
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [shares])

  useEffect(() => {
    if (canScroll) {
      const timer = setTimeout(() => setShowScrollHint(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [canScroll])

  const handleScroll = () => {
    if (showScrollHint) {
      setShowScrollHint(false)
    }
  }

  return (
    <div className="relative">
      <div 
        ref={scrollContainerRef}
        className="table-scroll-container overflow-x-auto"
        onScroll={handleScroll}
      >
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">Loại</TableHead>
              <TableHead className="text-muted-foreground">Tài liệu</TableHead>
              <TableHead className="text-muted-foreground">Vị trí</TableHead>
              <TableHead className="text-muted-foreground">Người chia sẻ</TableHead>
              <TableHead className="text-muted-foreground">Người nhận</TableHead>
              <TableHead className="text-muted-foreground">Quyền</TableHead>
              <TableHead className="text-muted-foreground">Trạng thái</TableHead>
              <TableHead className="text-muted-foreground">Ngày chia sẻ</TableHead>
              <TableHead className="text-muted-foreground">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border">
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Đang tải lịch sử...
                </TableCell>
              </TableRow>
            ) : shares.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Chưa có lịch sử chia sẻ
                </TableCell>
              </TableRow>
            ) : (
              shares.map((item: ShareItem) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell>{getTypeBadge("project")}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {item.content?.title || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.content?.project?.name && (
                      <div>📁 {item.content.project.name}</div>
                    )}
                    {item.content?.module?.name && (
                      <div className="text-xs">📦 {item.content.module.name}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-xs">
                          {(item.sharedBy?.name || item.sharedBy?.email || "").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.sharedBy?.name || item.sharedBy?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.sharedBy?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-xs">
                          {(item.sharedWith?.name || item.sharedWith?.email || "").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.sharedWith?.name || item.sharedWith?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.sharedWith?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPermissionBadges(item)}</TableCell>
                  <TableCell>
                    {item.status?.toLowerCase() === "active" ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        Đã thu hồi
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        {item.status?.toLowerCase() === "revoked" && onReshare && (
                          <DropdownMenuItem onClick={() => onReshare(item)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Chia sẻ lại
                          </DropdownMenuItem>
                        )}
                        {item.status?.toLowerCase() === "active" && (
                          <>
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                Chỉnh sửa quyền
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {onRevoke && (
                              <DropdownMenuItem
                                className="text-red-400"
                                onClick={() => onRevoke(item)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Thu hồi
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {canScroll && showScrollHint && (
        <div className="md:hidden absolute bottom-4 right-4 bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-bounce">
          <span>Vuốt để xem thêm</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

