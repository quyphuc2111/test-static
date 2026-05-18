"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  History, RotateCcw, CheckCircle2, XCircle, Clock, FileArchive, User, ChevronDown, ChevronUp, Trash2, HardDrive, Download
} from "lucide-react"
import type { ContentItem } from "@/components/content/table"
import { useContentVersions } from "@/modules/content/hooks/useContentVersions"
import { useRestoreVersion } from "@/modules/content/hooks/useRestoreVersion"
import { useDeleteVersion } from "@/modules/content/hooks/useDeleteVersion"

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: ContentItem | null
  projectId: string
  moduleId: string
  canDownload: boolean
  canEdit: boolean
  canDelete: boolean
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  })
}

const statusConfig = {
  COMPLETED: { label: "Hoàn thành", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
  FAILED: { label: "Lỗi", icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
  PROCESSING: { label: "Đang xử lý", icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
}

export function VersionHistoryDialog({
  open, onOpenChange, content, projectId, moduleId, canDownload, canEdit, canDelete
}: VersionHistoryDialogProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [showTopShadow, setShowTopShadow] = useState(false)
  const [showBottomShadow, setShowBottomShadow] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const updateShadows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setShowTopShadow(el.scrollTop > 8)
    setShowBottomShadow(el.scrollTop + el.clientHeight < el.scrollHeight - 8)
  }, [])

  const contentId = content?.id ? String(content.id) : ""
  const { data: versions = [], isLoading } = useContentVersions(
    projectId, moduleId, contentId, open && !!contentId
  )
  const restoreMutation = useRestoreVersion(projectId, moduleId, contentId)
  const deleteMutation = useDeleteVersion(projectId, moduleId, contentId)

  // Check shadows when versions load or expand/collapse
  useEffect(() => {
    const timer = setTimeout(updateShadows, 50)
    return () => clearTimeout(timer)
  }, [versions, expandedVersion, updateShadows])

  const handleRestore = async (versionId: number) => {
    await restoreMutation.mutateAsync(String(versionId))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0 bg-white">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-200 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-slate-900">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-100">
              <History className="h-4 w-4 text-blue-600" />
            </div>
            Lịch sử phiên bản
          </SheetTitle>
          <SheetDescription className="text-slate-600">
            {content?.title} — {versions.length} phiên bản
          </SheetDescription>
        </SheetHeader>

        <div className="relative flex-1 min-h-0">
          {/* Top scroll shadow */}
          <div className={`absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none transition-opacity duration-200 ${showTopShadow ? 'opacity-100' : 'opacity-0'}`} />
          {/* Bottom scroll shadow */}
          <div className={`absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none transition-opacity duration-200 ${showBottomShadow ? 'opacity-100' : 'opacity-0'}`} />

          <div
            ref={scrollRef}
            onScroll={updateShadows}
            className="h-full overflow-y-auto"
          >
          <div className="space-y-3 p-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Chưa có lịch sử phiên bản. Phiên bản sẽ được tạo tự động khi bạn cập nhật file.
              </div>
            ) : (
              versions.map((version, index) => {
                const statusCfg = statusConfig[version.status] || statusConfig.PROCESSING
                const StatusIcon = statusCfg.icon
                const isExpanded = expandedVersion === String(version.id)
                const isLatest = index === 0

                return (
                  <div
                    key={version.id}
                    className={`border rounded-lg transition-all ${
                      isLatest
                        ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    {/* Version header */}
                    <button
                      className="w-full flex items-center gap-3 p-3 text-left"
                      onClick={() => setExpandedVersion(isExpanded ? null : String(version.id))}
                    >
                      <div className={`flex items-center justify-center h-10 w-10 rounded-lg shrink-0 ${
                        isLatest ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        <span className="text-sm font-bold">v{version.version}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {version.isCurrent ? "Phiên bản hiện tại" : `Phiên bản ${version.version}`}
                          </span>
                          {version.isCurrent && (
                            <Badge className="text-[10px] bg-green-600 text-white hover:bg-green-600">
                              Hiện tại
                            </Badge>
                          )}
                          <Badge variant="secondary" className={`text-[10px] ${statusCfg.bg} ${statusCfg.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <FileArchive className="h-3 w-3" />
                            {formatFileSize(version.fileSize)}
                          </span>
                          {!version.isCurrent && version.archiveSize && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <HardDrive className="h-3 w-3" />
                              {formatFileSize(version.archiveSize)}
                            </span>
                          )}
                          {version.createdBy && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {version.createdBy.name || version.createdBy.username}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(version.createdAt)}
                          </span>
                        </div>
                      </div>

                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      }
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-800">
                        <div className="mt-3 space-y-2">
                          {version.contentUrl && (
                            <div className="text-xs">
                              <span className="text-slate-500 mb-1 block">URL:</span>
                              <code className="block bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded text-slate-700 dark:text-slate-300 font-mono text-[11px] break-all overflow-hidden">
                                {version.contentUrl}
                              </code>
                            </div>
                          )}

                          {version.launchFile && (
                            <div className="text-xs">
                              <span className="text-slate-500 mb-1 block">Launch file:</span>
                              <code className="block bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded text-slate-700 dark:text-slate-300 font-mono text-[11px] break-all overflow-hidden">
                                {version.launchFile}
                              </code>
                            </div>
                          )}

                          {version.status === "COMPLETED" && (
                            <div className="flex gap-2 mt-2">
                              {version.isCurrent ? (
                                canDownload && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                                    asChild
                                  >
                                    <a
                                      href={`/api/projects/${projectId}/modules/${moduleId}/content/${contentId}/download`}
                                      download
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      Tải xuống
                                    </a>
                                  </Button>
                                )
                              ) : (
                                <>
                                  {canDownload && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                                      asChild
                                    >
                                      <a
                                        href={version.contentUrl}
                                        download={`v${version.version}.zip`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </a>
                                    </Button>
                                  )}
                                  {canEdit && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                      disabled={restoreMutation.isPending || deleteMutation.isPending}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRestore(version.id)
                                      }}
                                    >
                                      <RotateCcw className={`h-3.5 w-3.5 ${restoreMutation.isPending ? "animate-spin" : ""}`} />
                                      {restoreMutation.isPending ? "Đang khôi phục..." : "Khôi phục"}
                                    </Button>
                                  )}
                                  {canDelete && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                      disabled={restoreMutation.isPending || deleteMutation.isPending}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (deletingId === version.id) {
                                          deleteMutation.mutate(String(version.id), {
                                            onSettled: () => setDeletingId(null)
                                          })
                                        } else {
                                          setDeletingId(version.id)
                                          setTimeout(() => setDeletingId(prev => prev === version.id ? null : prev), 3000)
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      {deletingId === version.id ? "Xác nhận xóa?" : "Xóa"}
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {version.status === "FAILED" && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-2 text-xs text-red-600">
                              {version.errorMessage || "Phiên bản này bị lỗi trong quá trình xử lý và không thể khôi phục."}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
