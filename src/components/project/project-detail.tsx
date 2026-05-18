"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Plus, Upload, MoreHorizontal, FileText,
  FolderOpen, Play, Download, Trash2, Search, Edit, ExternalLink, Copy, Info, AlertTriangle, History,
  RotateCcw, Archive, ArrowUpDown, Share2, ChevronLeft, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { JsonModal } from "@/components/content/modal/json-modal"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { useModules } from "@/modules/project/hooks/useModules"
import { useContent } from "@/modules/content/hooks/useContent"
import { CreateModuleDialog } from "@/components/project/modal/create-module-dialog"
import { EditModuleDialog } from "@/components/project/modal/edit-module-dialog"
import { useDeleteModule } from "@/modules/project/hooks/useDeleteModule"
import { useDownloadContent } from "@/modules/content/hooks/useDownloadContent"
import { useSoftDeleteContent } from "@/modules/content/hooks/useSoftDeleteContent"
import { useHardDeleteContent } from "@/modules/content/hooks/useHardDeleteContent"
import { useRestoreContent } from "@/modules/content/hooks/useRestoreContent"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { Permissions } from "@/constants/permissions"
import { CreateContentDialog } from "@/components/content/modal/create-content-dialog"
import { EditContentDialog } from "@/components/content/modal/edit-content-dialog"
import { SoftDeleteDialog } from "@/components/content/modal/soft-delete-dialog"
import { HardDeleteDialog } from "@/components/content/modal/hard-delete-dialog"
import { UpdateFileDialog } from "@/components/content/modal/update-file-dialog"
import { VersionHistoryDialog } from "@/components/content/modal/version-history-dialog"
import { ShareModuleModal } from "@/components/content/modal/share-modal"
import { useContentSSE } from "@/modules/content/hooks/useContentSSE"
import type { ContentItem } from "@/components/content/table/columns"
import { getContentUrl, getScormContentUrl } from "@/utils/content"
import { toast } from "react-toastify"
import { useAuth } from "@/modules/auth/hooks/useAuth"
import { useUserPermissions } from "@/modules/rbac/hooks/useUserPermissions"
import { PermissionName } from "@prisma/client"

function formatFileSize(bytes?: number): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ProjectDetail() {
  const { user } = useAuth()
  const { hasPermission } = useUserPermissions()

  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = params.id as string

  const moduleIdFromUrl = searchParams.get("module") || ""
  const [activeModuleId, setActiveModuleIdState] = useState<string>(moduleIdFromUrl)

  const setActiveModuleId = useCallback((id: string) => {
    setActiveModuleIdState(id)
    const params = new URLSearchParams(window.location.search)
    if (id) {
      params.set("module", id)
    } else {
      params.delete("module")
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router])
  const [moduleSearch, setModuleSearch] = useState("")
  const [moduleSort, setModuleSort] = useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest")
  const [contentSearch, setContentSearch] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Module dialog
  const [createModuleOpen, setCreateModuleOpen] = useState(false)

  // Content dialogs
  const [createContentOpen, setCreateContentOpen] = useState(false)
  const [editContent, setEditContent] = useState<ContentItem | null>(null)
  const [deleteContent, setDeleteContent] = useState<ContentItem | null>(null)
  const [updateFileContent, setUpdateFileContent] = useState<ContentItem | null>(null)
  const [hardDeleteContent, setHardDeleteContent] = useState<ContentItem | null>(null)
  const [versionHistoryContent, setVersionHistoryContent] = useState<ContentItem | null>(null)
  const [deleteModuleWarning, setDeleteModuleWarning] = useState<{ moduleId: string; moduleName: string } | null>(null)
  const [editModule, setEditModule] = useState<{ id: string; name: string; description: string; status: "ACTIVE" | "INACTIVE" } | null>(null)

  // API hooks
  useContentSSE(projectId, activeModuleId)
  const { projects, isLoading: projectsLoading } = useProjects()
  const { data: modules, isLoading: modulesLoading } = useModules(projectId, !!projectId)
  const { data: contentList, isLoading: contentLoading } = useContent(
    projectId,
    activeModuleId,
    !!projectId && !!activeModuleId
  )

  const deleteModuleMutation = useDeleteModule(projectId)
  const downloadMutation = useDownloadContent(projectId, activeModuleId)
  const softDeleteMutation = useSoftDeleteContent(projectId, activeModuleId)
  const hardDeleteMutation = useHardDeleteContent(projectId, activeModuleId)
  const restoreMutation = useRestoreContent(projectId, activeModuleId)

  const project = useMemo(
    () => projects?.find((p) => p.id === projectId),
    [projects, projectId]
  )

  const filteredModules = useMemo(() => {
    const filtered = (modules || []).filter((m: any) =>
      m.name.toLowerCase().includes(moduleSearch.toLowerCase())
    )
    return filtered.sort((a: any, b: any) => {
      switch (moduleSort) {
        case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "name-asc": return a.name.localeCompare(b.name, "vi")
        case "name-desc": return b.name.localeCompare(a.name, "vi")
        default: return 0
      }
    })
  }, [modules, moduleSearch, moduleSort])

  const activeContent = useMemo(
    () => (contentList || []).filter((c: any) => !c.isDeleted),
    [contentList]
  )

  const deletedContent = useMemo(
    () => (contentList || []).filter((c: any) => c.isDeleted),
    [contentList]
  )

  const filteredContent = useMemo(
    () => (showDeleted ? deletedContent : activeContent).filter((c: any) =>
      c.title.toLowerCase().includes(contentSearch.toLowerCase())
    ),
    [activeContent, deletedContent, showDeleted, contentSearch]
  )

  const totalPages = Math.max(1, Math.ceil(filteredContent.length / pageSize))
  const paginatedContent = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredContent.slice(start, start + pageSize)
  }, [filteredContent, page, pageSize])

  const pageStartItem = filteredContent.length === 0 ? 0 : (page - 1) * pageSize + 1
  const pageEndItem = Math.min(page * pageSize, filteredContent.length)

  const buildPageItems = (): (number | "...")[] => {
    const maxButtons = 7
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const items: (number | "...")[] = []
    const showLeft = page > 4
    const showRight = page < totalPages - 3
    const start = showLeft ? page - 1 : 1
    const end = showRight ? page + 1 : totalPages

    items.push(1)
    if (showLeft) items.push("...")
    for (let p = Math.max(2, start); p <= Math.min(totalPages - 1, end); p++) {
      items.push(p)
    }
    if (showRight) items.push("...")
    items.push(totalPages)
    return items
  }

  // Reset pagination context changes
  useEffect(() => {
    setPage(1)
  }, [activeModuleId, showDeleted, contentSearch, pageSize])

  // Keep page valid when data changes
  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  // Sync module from URL or auto-select first module
  const initializedRef = useRef(false)
  useEffect(() => {
    if (!modules || modules.length === 0) return

    const urlModuleId = searchParams.get("module") || ""

    // On first load, prioritize URL param
    if (!initializedRef.current) {
      initializedRef.current = true
      if (urlModuleId && modules.some((m) => String(m.id) === urlModuleId)) {
        setActiveModuleIdState(urlModuleId)
        return
      }
    }

    // If no valid module selected, pick first
    if (!activeModuleId || !modules.some((m) => String(m.id) === activeModuleId)) {
      setActiveModuleId(String(modules[0].id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules])

  const handleDeleteModule = async (moduleId: string) => {
    // If deleting the active module and it has deleted content (trash), show warning
    if (moduleId === activeModuleId && deletedContent.length > 0) {
      const mod = modules?.find((m) => String(m.id) === moduleId)
      setDeleteModuleWarning({ moduleId, moduleName: mod?.name || "Module" })
      return
    }
    try {
      await deleteModuleMutation.mutateAsync({ projectId, moduleId })
      if (activeModuleId === moduleId) setActiveModuleId("")
      toast.success("Đã xóa module")
    } catch {
      // Error toast handled by useDeleteModule onError
    }
  }

  const handleForceDeleteModule = async () => {
    if (!deleteModuleWarning) return
    try {
      await deleteModuleMutation.mutateAsync({ projectId, moduleId: deleteModuleWarning.moduleId })
      if (activeModuleId === deleteModuleWarning.moduleId) setActiveModuleId("")
      toast.success("Đã xóa module")
      setDeleteModuleWarning(null)
    } catch {
      // Error toast handled by useDeleteModule onError
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteContent) return
    await softDeleteMutation.mutateAsync(deleteContent.id)
    setDeleteContent(null)
  }

  const handleConfirmHardDelete = async () => {
    if (!hardDeleteContent) return
    await hardDeleteMutation.mutateAsync(hardDeleteContent.id)
    setHardDeleteContent(null)
  }

  const activeModule = modules?.find((m) => String(m.id) === activeModuleId)

  const statusLabel = project?.isDeleted
    ? "Đã xóa"
    : project?.status === "ACTIVE"
      ? "Hoạt động"
      : project?.status === "INACTIVE"
        ? "Tạm dừng"
        : "Lưu trữ"

  const statusClass = project?.isDeleted
    ? "bg-red-100 text-red-600 dark:bg-red-900/30"
    : project?.status === "ACTIVE"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30"
      : "bg-slate-100 text-slate-500 dark:bg-slate-800"

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 shrink-0">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/project"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            {projectsLoading ? (
              <Skeleton className="h-7 w-48 mb-1" />
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {project?.name || "Dự án"}
                </h2>
                {project && (
                  <span className={`px-2 py-0.5 font-bold text-[10px] uppercase rounded ${statusClass}`}>
                    {statusLabel}
                  </span>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý modules và tải lên nội dung web tĩnh hoặc gói SCORM.
            </p>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Modules Sidebar */}
        <div className="w-full md:w-64 flex flex-col shrink-0 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs uppercase text-slate-500 tracking-wider">Modules</h3>
              <PermissionGuard permission={Permissions.Module.CREATE}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setCreateModuleOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </PermissionGuard>
            </div>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Tìm module..."
                  className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 border-slate-200 dark:border-slate-800">
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className={`text-xs ${moduleSort === "newest" ? "font-semibold text-blue-600" : ""}`} onClick={() => setModuleSort("newest")}>
                    Mới nhất
                  </DropdownMenuItem>
                  <DropdownMenuItem className={`text-xs ${moduleSort === "oldest" ? "font-semibold text-blue-600" : ""}`} onClick={() => setModuleSort("oldest")}>
                    Cũ nhất
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className={`text-xs ${moduleSort === "name-asc" ? "font-semibold text-blue-600" : ""}`} onClick={() => setModuleSort("name-asc")}>
                    Tên A → Z
                  </DropdownMenuItem>
                  <DropdownMenuItem className={`text-xs ${moduleSort === "name-desc" ? "font-semibold text-blue-600" : ""}`} onClick={() => setModuleSort("name-desc")}>
                    Tên Z → A
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {modulesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))
            ) : filteredModules.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                {moduleSearch ? "Không tìm thấy module." : "Chưa có module nào."}
              </div>
            ) : (
              filteredModules.map((mod) => (
                <div key={mod.id} className="group relative">
                  <button
                    onClick={() => setActiveModuleId(String(mod.id))}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${activeModuleId === String(mod.id)
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                      : "hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
                      }`}
                  >
                    <div className="flex items-center truncate">
                      <FolderOpen className={`h-4 w-4 mr-2 shrink-0 ${activeModuleId === String(mod.id) ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                      <span className="truncate">{mod.name}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <span className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity">
                          <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <PermissionGuard permission={Permissions.Module.EDIT}>
                          <DropdownMenuItem
                            className="gap-2 text-xs"
                            onClick={(e) => { e.stopPropagation(); setEditModule({ id: String(mod.id), name: mod.name, description: mod.description || "", status: (mod.status as "ACTIVE" | "INACTIVE") || "ACTIVE" }) }}
                          >
                            <Edit className="h-3.5 w-3.5" /> Chỉnh sửa
                          </DropdownMenuItem>
                        </PermissionGuard>
                        <PermissionGuard permission={Permissions.Module.SOFT_DELETE}>
                          <DropdownMenuItem
                            className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950 text-xs"
                            onClick={(e) => { e.stopPropagation(); handleDeleteModule(String(mod.id)) }}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Xóa module
                          </DropdownMenuItem>
                        </PermissionGuard>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Content header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 shrink-0">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                  {activeModule?.name || "Chọn một module"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {showDeleted
                    ? `${filteredContent.length} nội dung trong thùng rác`
                    : `${filteredContent.length} gói nội dung`
                  }
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto">
                <div className="relative flex-1 sm:min-w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={showDeleted ? "Tìm trong thùng rác..." : "Tìm nội dung..."}
                    className="h-9 pl-8 text-sm"
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                  />
                </div>

                {!showDeleted && (
                  <>
                    <PermissionGuard permission={Permissions.Content.SHARE}>
                      <ShareModuleModal itemName={activeModule?.name} moduleId={activeModuleId ? Number(activeModuleId) : undefined} projectId={projectId ? Number(projectId) : undefined}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 flex-1 sm:flex-none h-9"
                          disabled={!activeModuleId}
                        >
                          <Share2 className="h-4 w-4" /> Chia sẻ
                        </Button>
                      </ShareModuleModal>
                    </PermissionGuard>
                    <PermissionGuard permissions={[Permissions.Content.CREATE, Permissions.ContentScope.MANAGE_OWN]}>
                      <Button
                        size="sm"
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none h-9"
                        onClick={() => setCreateContentOpen(true)}
                        disabled={!activeModuleId}
                      >
                        <Upload className="h-4 w-4" /> Tải lên
                      </Button>
                    </PermissionGuard>
                  </>
                )}
              </div>
            </div>
            {activeModuleId && (
              <PermissionGuard permissions={[Permissions.Content.SOFT_DELETE, Permissions.ContentScope.MANAGE_OWN]}>
                <Tabs value={showDeleted ? "deleted" : "active"} onValueChange={(v) => { setShowDeleted(v === "deleted"); setContentSearch("") }}>
                  <TabsList className="h-8">
                    <TabsTrigger value="active" className="text-xs h-7 px-3 gap-1.5">
                      <FileText className="h-3 w-3" />
                      Nội dung
                      {activeContent.length > 0 && (
                        <span className="ml-1 text-[10px] bg-slate-200 dark:bg-slate-700 rounded-full px-1.5">{activeContent.length}</span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="deleted" className="text-xs h-7 px-3 gap-1.5">
                      <Trash2 className="h-3 w-3" />
                      Thùng rác
                      {deletedContent.length > 0 && (
                        <span className="ml-1 text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full px-1.5">{deletedContent.length}</span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </PermissionGuard>
            )}
          </div>

          {/* Content table */}
          <div className="flex-1 overflow-auto">
            {!activeModuleId ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-slate-500">
                <FolderOpen className="h-10 w-10 mb-3 text-slate-300" />
                <p className="text-sm">Chọn một module để xem nội dung</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="w-[200px] xl:w-[280px]">Mô tả</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Kích thước</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Người tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredContent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                        {contentSearch ? (
                          "Không tìm thấy nội dung phù hợp."
                        ) : showDeleted ? (
                          <div className="flex flex-col items-center gap-2">
                            <Archive className="h-8 w-8 text-slate-300" />
                            <span>Thùng rác trống.</span>
                          </div>
                        ) : (
                          "Chưa có nội dung nào trong module này."
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedContent.map((content: any) => (
                      <TableRow key={content.id} className={showDeleted ? "opacity-60" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2" title={content.title}>
                            <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px] block">{content.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="w-[200px] xl:w-[280px] max-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 w-full min-w-0">
                            {content.description ? (
                              <JsonModal title={`${content.title} Description`} jsonData={content.description}>
                                <div className="flex items-center gap-2 cursor-pointer group w-full min-w-0 text-slate-500 hover:text-blue-600 transition-colors">
                                  <TooltipProvider delayDuration={300}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="truncate font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 group-hover:border-blue-300 dark:group-hover:border-blue-700">
                                          {typeof content.description === "object"
                                            ? JSON.stringify(content.description)
                                            : content.description}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs break-all">
                                        Click để xem chi tiết JSON
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <Info className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100" />
                                </div>
                              </JsonModal>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 dark:bg-slate-800">
                            {content.contentType === "FILE_ZIP_SCORM" ? "SCORM" : "HTML"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {formatFileSize(content.fileSize)}
                        </TableCell>
                        <TableCell>
                          {content.status === "UPLOADING" ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse">
                                Đang tải lên
                              </Badge>
                              {content.progress !== undefined && content.progress > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-12 bg-muted rounded-full h-1.5">
                                    <div className="bg-amber-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${content.progress}%` }} />
                                  </div>
                                  <span className="text-[10px] text-amber-400 font-medium">{content.progress}%</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${content.status === "COMPLETED"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : content.status === "FAILED"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse"
                                }`}
                            >
                              {content.status === "COMPLETED" ? "Hoàn thành" : content.status === "FAILED" ? "Lỗi" : "Đang xử lý"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {content.owner?.username || content.owner?.name || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {showDeleted ? (
                            <div className="flex items-center justify-end gap-1">
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                      onClick={() => restoreMutation.mutate(content.id)}
                                      disabled={restoreMutation.isPending}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="z-50">Khôi phục</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {hasPermission(PermissionName.HARD_DELETE_CONTENT) && (
                                <TooltipProvider delayDuration={300}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={() => setHardDeleteContent(content as ContentItem)}
                                      >
                                        <AlertTriangle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-50">Xóa vĩnh viễn</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          ) : (() => {
                            const isOwner = Number(content.owner?.id) === Number(user?.id);
                            const isAdmin = (user?.roles || []).includes("ADMINISTRATOR");
                            const canManageAll = hasPermission(PermissionName.MANAGE_ALL_CONTENT);
                            const canManageOwn = hasPermission(PermissionName.MANAGE_OWN_CONTENT);
                            const canEditGlobal = hasPermission(PermissionName.EDIT_CONTENT);
                            const canDownloadGlobal = hasPermission(PermissionName.DOWNLOAD_CONTENT);
                            const canSoftDeleteGlobal = hasPermission(PermissionName.SOFT_DELETE_CONTENT);
                            const canHardDeleteGlobal = hasPermission(PermissionName.HARD_DELETE_CONTENT);

                            const itemCanEdit = isAdmin || canManageAll || (isOwner && (canEditGlobal || canManageOwn)) || content.sharePermissions?.canEdit === true;
                            const itemCanDownload = isAdmin || canManageAll || (isOwner && (canDownloadGlobal || canManageOwn)) || content.sharePermissions?.canDownload === true;
                            const itemCanSoftDelete = isAdmin || canManageAll || (isOwner && (canSoftDeleteGlobal || canManageOwn)) || content.sharePermissions?.canDelete === true;
                            const itemCanHardDelete = isAdmin || canManageAll || canHardDeleteGlobal;

                            return (
                              <>
                                {content.status === "COMPLETED" && (
                                  <Button variant="ghost" size="icon" asChild>
                                    <Link
                                      href={content.contentType === "FILE_ZIP_SCORM"
                                        ? getScormContentUrl(content as ContentItem)
                                        : getContentUrl(content as ContentItem)}
                                      target="_blank"
                                    >
                                      <Play className="h-4 w-4 text-blue-600" />
                                    </Link>
                                  </Button>
                                )}
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {content.status === "COMPLETED" && (
                                      <>
                                        <DropdownMenuItem
                                          className="gap-2 focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-900/30"
                                          onClick={() => {
                                            const url = content.contentType === "FILE_ZIP_SCORM"
                                              ? getScormContentUrl(content as ContentItem)
                                              : getContentUrl(content as ContentItem)
                                            window.open(url, "_blank")
                                          }}
                                        >
                                          <ExternalLink className="h-4 w-4" /> Xem nội dung
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="gap-2 focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-900/30"
                                          onClick={() => {
                                            const url = getContentUrl(content as ContentItem)
                                            const fullUrl = `${window.location.origin}${url}`
                                            navigator.clipboard.writeText(fullUrl)
                                            toast.success("Đã sao chép URL")
                                          }}
                                        >
                                          <Copy className="h-4 w-4" /> Sao chép URL
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                      </>
                                    )}
                                    {itemCanEdit && (
                                      <DropdownMenuItem
                                        className="gap-2 focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-900/30"
                                        onClick={() => setEditContent(content as ContentItem)}
                                      >
                                        <Edit className="h-4 w-4" /> Chỉnh sửa
                                      </DropdownMenuItem>
                                    )}
                                    {itemCanEdit && (
                                      <DropdownMenuItem
                                        className="gap-2 focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-900/30"
                                        onClick={() => setUpdateFileContent(content as ContentItem)}
                                      >
                                        <Upload className="h-4 w-4" /> Cập nhật file
                                      </DropdownMenuItem>
                                    )}
                                    {itemCanDownload && (
                                      <DropdownMenuItem
                                        className="gap-2 focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-900/30"
                                        onClick={() => downloadMutation.mutate(content.id)}
                                      >
                                        <Download className="h-4 w-4" /> Tải xuống ZIP
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      className="gap-2 focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-900/30"
                                      onClick={() => setVersionHistoryContent(content as ContentItem)}
                                    >
                                      <History className="h-4 w-4" /> Lịch sử phiên bản
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {itemCanSoftDelete && (
                                      <DropdownMenuItem
                                        className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950"
                                        onClick={() => setDeleteContent(content as ContentItem)}
                                      >
                                        <Trash2 className="h-4 w-4" /> Xóa
                                      </DropdownMenuItem>
                                    )}
                                    {itemCanHardDelete && (
                                      <DropdownMenuItem
                                        className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950"
                                        onClick={() => setHardDeleteContent(content as ContentItem)}
                                      >
                                        <AlertTriangle className="h-4 w-4" /> Xóa vĩnh viễn
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )
                          })()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {!!activeModuleId && filteredContent.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  Hiển thị {pageStartItem}-{pageEndItem} / {filteredContent.length}
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>

                    {buildPageItems().map((it, idx) =>
                      it === "..." ? (
                        <span key={`dots-${idx}`} className="px-1 text-slate-400">…</span>
                      ) : (
                        <Button
                          key={it}
                          variant={page === it ? "default" : "outline"}
                          size="icon"
                          className="h-7 w-7 text-xs"
                          onClick={() => setPage(it)}
                        >
                          {it}
                        </Button>
                      )
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <select
                    className="h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    {[10, 20, 50, 100].map((s) => (
                      <option key={s} value={s}>{s}/trang</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {editModule && (
        <EditModuleDialog
          open={!!editModule}
          onOpenChange={(open) => { if (!open) setEditModule(null) }}
          projectId={projectId}
          module={editModule}
        />
      )}
      <CreateModuleDialog
        open={createModuleOpen}
        onOpenChange={setCreateModuleOpen}
        projectId={projectId}
      />
      {createContentOpen && (
        <CreateContentDialog
          open={createContentOpen}
          onOpenChange={setCreateContentOpen}
          projectId={projectId}
          moduleId={activeModuleId}
        />
      )}
      {editContent && (
        <EditContentDialog
          open={!!editContent}
          onOpenChange={(open) => { if (!open) setEditContent(null) }}
          content={editContent}
          projectId={projectId}
          moduleId={activeModuleId}
        />
      )}
      {deleteContent && (
        <SoftDeleteDialog
          open={!!deleteContent}
          onOpenChange={(open) => { if (!open) setDeleteContent(null) }}
          content={deleteContent}
          onConfirm={handleConfirmDelete}
          isDeleting={softDeleteMutation.isPending}
        />
      )}
      {updateFileContent && (
        <UpdateFileDialog
          open={!!updateFileContent}
          onOpenChange={(open) => { if (!open) setUpdateFileContent(null) }}
          content={updateFileContent}
          projectId={projectId}
          moduleId={activeModuleId}
        />
      )}
      {hardDeleteContent && (
        <HardDeleteDialog
          open={!!hardDeleteContent}
          onOpenChange={(open) => { if (!open) setHardDeleteContent(null) }}
          content={hardDeleteContent}
          onConfirm={handleConfirmHardDelete}
          isDeleting={hardDeleteMutation.isPending}
        />
      )}
      {versionHistoryContent && (() => {
        const isOwner = Number(versionHistoryContent.owner?.id) === Number(user?.id);
        const isAdmin = (user?.roles || []).includes("ADMINISTRATOR");
        const canManageAll = hasPermission(PermissionName.MANAGE_ALL_CONTENT);
        const canManageOwn = hasPermission(PermissionName.MANAGE_OWN_CONTENT);
        const canEditGlobal = hasPermission(PermissionName.EDIT_CONTENT);
        const canDownloadGlobal = hasPermission(PermissionName.DOWNLOAD_CONTENT);
        const canSoftDeleteGlobal = hasPermission(PermissionName.SOFT_DELETE_CONTENT);

        const canEdit = isAdmin || canManageAll || (isOwner && (canEditGlobal || canManageOwn)) || versionHistoryContent.sharePermissions?.canEdit === true;
        const canDownload = isAdmin || canManageAll || (isOwner && (canDownloadGlobal || canManageOwn)) || versionHistoryContent.sharePermissions?.canDownload === true;
        const canDelete = isAdmin || canManageAll || (isOwner && (canSoftDeleteGlobal || canManageOwn)) || versionHistoryContent.sharePermissions?.canDelete === true;

        return (
          <VersionHistoryDialog
            open={!!versionHistoryContent}
            onOpenChange={(open) => { if (!open) setVersionHistoryContent(null) }}
            content={versionHistoryContent}
            projectId={projectId}
            moduleId={activeModuleId}
            canDownload={canDownload}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )
      })()}
      {/* Delete Module Warning - Trash not empty */}
      <Dialog open={!!deleteModuleWarning} onOpenChange={(open) => { if (!open) setDeleteModuleWarning(null) }}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Thùng rác chưa được dọn
            </DialogTitle>
            <DialogDescription className="pt-3 text-slate-600 space-y-3">
              <p>
                Module <span className="font-medium text-slate-800">&quot;{deleteModuleWarning?.moduleName}&quot;</span> còn{" "}
                <span className="font-semibold text-red-600">{deletedContent.length}</span> tài liệu trong thùng rác.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <p className="text-amber-800 font-medium text-sm flex items-center gap-1.5">
                  <Archive className="h-4 w-4" /> Nội dung trong thùng rác:
                </p>
                <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                  {deletedContent.map((c: any) => (
                    <li key={c.id} className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm">
                Hãy xóa vĩnh viễn các tài liệu trong thùng rác trước để tối ưu dung lượng, hoặc tiếp tục xóa module.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDeleteModuleWarning(null); setShowDeleted(true) }}>
              Mở thùng rác
            </Button>
            <Button
              variant="destructive"
              onClick={handleForceDeleteModule}
              disabled={deleteModuleMutation.isPending}
            >
              {deleteModuleMutation.isPending ? "Đang xóa..." : "Vẫn xóa module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
