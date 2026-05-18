"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { Search, Calendar, User, FileText, Clock, UserMinus, Share2, RotateCcw, Edit, MoreHorizontal, MoreVertical, Eye, EyeOff, Edit3, Trash2, Shield, Filter, SortAsc, SortDesc, Download, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useContentShares, useRevokeContentShare, useShareContent, useUpdateContentShare } from "@/modules/rbac/hooks/useContentSharing"
import { RevokeShareDialog } from "./modal/revoke-share-dialog"
import { ReshareDialog } from "./modal/reshare-dialog"
import { EditPermissionsDialog } from "./modal/edit-permissions-dialog"
import { SharingHistoryTable } from "./table/sharing-history-table"
import { useModules } from "@/modules/project/hooks/useModules"
import { toast } from "react-toastify"

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

const getPermissionBadges = (share: any) => {
  const items: any[] = []
  if (share?.canView) items.push(<Badge key="v" variant="outline">Xem</Badge>)
  if (share?.canDownload) items.push(<Badge key="dl" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Tải xuống</Badge>)
  if (share?.canEdit) items.push(<Badge key="e" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Sửa</Badge>)
  if (share?.canDelete) items.push(<Badge key="d" className="bg-red-500/20 text-red-400 border-red-500/30">Xóa</Badge>)
  return <div className="flex gap-1 flex-wrap">{items}</div>
}

export function SharingHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [moduleFilter, setModuleFilter] = useState<string>("all")
  const [sharedByFilter, setSharedByFilter] = useState<string>("all")
  const [sharedWithFilter, setSharedWithFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [showReshareDialog, setShowReshareDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [revokeShareId, setRevokeShareId] = useState<string>("")
  const [reshareData, setReshareData] = useState<any>(null)
  const [editData, setEditData] = useState<any>(null)
  const [permissions, setPermissions] = useState({
    canView: true,
    canDownload: true,
    canEdit: false,
    canDelete: false
  })
  const [showScrollHint, setShowScrollHint] = useState(true)
  const [canScroll, setCanScroll] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const { data: shares, isLoading } = useContentShares()
  const { data: modules, isLoading: modulesLoading } = useModules(projectFilter !== "all" ? projectFilter : "", projectFilter !== "all")
  const revokeShareMut = useRevokeContentShare()
  const shareContentMut = useShareContent()
  const updateShareMut = useUpdateContentShare()

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

  const filtered = useMemo(() => {
    let list = shares || []
    
    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter((s: any) =>
        (s.content?.title || '').toLowerCase().includes(q) ||
        (s.sharedBy?.name || s.sharedBy?.email || '').toLowerCase().includes(q) ||
        (s.sharedWith?.name || s.sharedWith?.email || '').toLowerCase().includes(q)
      )
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      list = list.filter((s: any) => s.status.toLowerCase() === statusFilter.toLowerCase())
    }
    
    // Filter by project
    if (projectFilter !== "all") {
      list = list.filter((s: any) => s.content?.project?.id === projectFilter)
    }
    
    // Filter by module (only if project is selected)
    if (moduleFilter !== "all" && projectFilter !== "all") {
      list = list.filter((s: any) => s.content?.module?.id === moduleFilter)
    }
    
    // Filter by shared by (người chia sẻ)
    if (sharedByFilter !== "all") {
      list = list.filter((s: any) => String(s.sharedById) === sharedByFilter)
    }
    
    // Filter by shared with (người nhận)
    if (sharedWithFilter !== "all") {
      list = list.filter((s: any) => String(s.sharedWithId) === sharedWithFilter)
    }
    
    // Sort
    list.sort((a: any, b: any) => {
      let aVal, bVal
      switch (sortBy) {
        case "title":
          aVal = a.content?.title || ""
          bVal = b.content?.title || ""
          break
        case "sharedBy":
          aVal = a.sharedBy?.name || a.sharedBy?.email || ""
          bVal = b.sharedBy?.name || b.sharedBy?.email || ""
          break
        case "sharedWith":
          aVal = a.sharedWith?.name || a.sharedWith?.email || ""
          bVal = b.sharedWith?.name || b.sharedWith?.email || ""
          break
        case "status":
          aVal = a.status
          bVal = b.status
          break
        default:
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    
    return list
  }, [shares, searchTerm, statusFilter, projectFilter, moduleFilter, sharedByFilter, sharedWithFilter, sortBy, sortOrder])

  const handleRevokeConfirm = () => {
    if (!revokeShareId) return
    revokeShareMut.mutate(
      { shareId: Number(revokeShareId) as any },
      {
        onSuccess: () => {
          toast.success("Đã thu hồi chia sẻ thành công")
          setShowRevokeDialog(false)
          setRevokeShareId("")
        },
        onError: (e: any) => {
          toast.error(e?.response?.data?.message || e?.message || "Thu hồi thất bại")
        },
      }
    )
  }

  const handleReshareConfirm = () => {
    if (!reshareData) return
    shareContentMut.mutate(
      {
        contentId: reshareData.contentId,
        sharedWithId: reshareData.sharedWithId,
        canView: reshareData.canView,
        canDownload: reshareData.canDownload,
        canEdit: reshareData.canEdit,
        canDelete: reshareData.canDelete
      },
      {
        onSuccess: () => {
          toast.success("Đã chia sẻ lại thành công")
          setShowReshareDialog(false)
          setReshareData(null)
        },
        onError: (e: any) => {
          toast.error(e?.response?.data?.message || e?.message || "Chia sẻ lại thất bại")
        },
      }
    )
  }

  const handleEditPermissions = () => {
    if (!editData) return
    updateShareMut.mutate(
      {
        shareId: editData.id,
        canView: permissions.canView,
        canDownload: permissions.canDownload,
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật quyền thành công")
          setShowEditDialog(false)
          setEditData(null)
        },
        onError: (e: any) => {
          toast.error(e?.response?.data?.message || e?.message || "Cập nhật quyền thất bại")
        },
      }
    )
  }

  const handleEditClick = (item: any) => {
    setEditData(item)
    setPermissions({
      canView: item.canView,
      canDownload: item.canDownload,
      canEdit: item.canEdit,
      canDelete: item.canDelete
    })
    setShowEditDialog(true)
  }

  const handleProjectChange = (projectId: string) => {
    setProjectFilter(projectId)
    setModuleFilter("all") // Reset module filter when project changes
  }

  const handleEditPermission = (item: any) => {
    handleEditClick(item)
  }

  const handleReshare = (item: any) => {
    setReshareData({
      contentId: item.contentId,
      sharedWithId: item.sharedWithId,
      canView: item.canView,
      canDownload: item.canDownload,
      canEdit: item.canEdit,
      canDelete: item.canDelete
    })
    setShowReshareDialog(true)
  }

  const handleRevoke = (item: any) => {
    setRevokeShareId(item.id)
    setShowRevokeDialog(true)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setProjectFilter("all")
    setModuleFilter("all")
    setSharedByFilter("all")
    setSharedWithFilter("all")
    setSortBy("createdAt")
    setSortOrder("desc")
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tài liệu, người chia sẻ, người nhận..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-border"
          />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Select value={sharedByFilter} onValueChange={setSharedByFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white">
              <SelectValue placeholder="Người chia sẻ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả người chia sẻ</SelectItem>
              {shares && Array.from(new Map(shares
                .filter((s: any) => s.sharedBy?.id)
                .map((s: any) => [s.sharedBy.id, { 
                  id: s.sharedBy.id, 
                  name: s.sharedBy.name || s.sharedBy.username,
                  email: s.sharedBy.email 
                }])
              ).values()).map((user: any) => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sharedWithFilter} onValueChange={setSharedWithFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white">
              <SelectValue placeholder="Người nhận" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả người nhận</SelectItem>
              {shares && Array.from(new Map(shares
                .filter((s: any) => s.sharedWith?.id)
                .map((s: any) => [s.sharedWith.id, { 
                  id: s.sharedWith.id, 
                  name: s.sharedWith.name || s.sharedWith.username,
                  email: s.sharedWith.email 
                }])
              ).values()).map((user: any) => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="revoked">Đã thu hồi</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={projectFilter} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-full sm:w-40 bg-white">
              <SelectValue placeholder="Dự án" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả dự án</SelectItem>
              {shares && Array.from(new Map(shares
                .filter((s: any) => s.content?.project?.id && s.content?.project?.name)
                .map((s: any) => [s.content.project.id, { id: s.content.project.id, name: s.content.project.name }])
              ).values()).map((project: any) => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white">
              <SelectValue placeholder={
                projectFilter === "all" 
                  ? "Module" 
                  : modulesLoading 
                    ? "Đang tải..." 
                    : "Module"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả module</SelectItem>
              {projectFilter === "all" ? (
                // Show all modules from shares when no project is selected
                shares && Array.from(new Map(shares
                  .filter((s: any) => s.content?.module?.id && s.content?.module?.name)
                  .map((s: any) => [s.content.module.id, { id: s.content.module.id, name: s.content.module.name }])
                ).values()).map((module: any) => (
                  <SelectItem key={module.id} value={module.id}>{module.name}</SelectItem>
                ))
              ) : (
                // Show modules from selected project
                modulesLoading ? (
                  <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                ) : (
                  modules && modules.map((module: any) => (
                    <SelectItem key={module.id} value={module.id}>{module.name}</SelectItem>
                  ))
                )
              )}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40 bg-white">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Thời gian</SelectItem>
              <SelectItem value="title">Tên tài liệu</SelectItem>
              <SelectItem value="sharedBy">Người chia sẻ</SelectItem>
              <SelectItem value="sharedWith">Người nhận</SelectItem>
              <SelectItem value="status">Trạng thái</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="w-full sm:w-auto"
          >
            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          
          {(searchTerm || statusFilter !== "all" || projectFilter !== "all" || moduleFilter !== "all" || sharedByFilter !== "all" || sharedWithFilter !== "all" || sortBy !== "createdAt" || sortOrder !== "desc") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="w-full sm:w-auto text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hôm nay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {shares?.filter((s: any) => {
                const today = new Date()
                const shareDate = new Date(s.createdAt)
                return shareDate.toDateString() === today.toDateString()
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Lượt chia sẻ</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tuần này</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {shares?.filter((s: any) => {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(s.createdAt) >= weekAgo
              }).length || 0}
            </div>
            <p className="text-xs text-green-400">7 ngày qua</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang hoạt động</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {shares?.filter((s: any) => s.status === 'ACTIVE').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Chia sẻ đang hoạt động</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã thu hồi</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {shares?.filter((s: any) => s.status === 'REVOKED').length || 0}
            </div>
            <p className="text-xs text-red-400">Chia sẻ đã thu hồi</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg sm:text-xl">Lịch sử Chia sẻ</CardTitle>
        </CardHeader>
        <CardContent className="w-[calc(100vw-2rem)] md:w-full">
          <SharingHistoryTable
            shares={filtered as any}
            isLoading={isLoading}
            onReshare={handleReshare}
            onEdit={handleEditPermission}
            onRevoke={handleRevoke}
          />
        </CardContent>
      </Card>

      <RevokeShareDialog
        open={showRevokeDialog}
        onOpenChange={setShowRevokeDialog}
        onConfirm={handleRevokeConfirm}
        isPending={revokeShareMut.isPending}
      />

      <ReshareDialog
        open={showReshareDialog}
        onOpenChange={setShowReshareDialog}
        onConfirm={handleReshareConfirm}
        isPending={shareContentMut.isPending}
      />

      <EditPermissionsDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        permissions={permissions}
        onPermissionsChange={setPermissions}
        onConfirm={handleEditPermissions}
        isPending={updateShareMut.isPending}
      />
    </div>
  )
}
