"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRecentActivity } from "@/modules/dashboard/hooks"
import { ActivityItem } from "@/modules/dashboard/dashboard.service"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

const dotColorMap: Record<string, string> = {
  created: "bg-blue-600",
  updated: "bg-blue-400",
  uploaded: "bg-blue-500",
  shared: "bg-purple-400",
  deleted: "bg-red-400",
  restored: "bg-green-400",
}

const getActivityDescription = (activity: ActivityItem) => {
  const { action, entityType, metadata } = activity
  switch (entityType) {
    case "ContentData":
      return {
        title: action === "created" ? "Tài liệu được tạo" : action === "updated" ? "Tài liệu cập nhật" : action === "deleted" ? "Tài liệu bị xóa" : action === "uploaded" ? "Tài liệu tải lên" : "Hành động tài liệu",
        desc: `${metadata?.title || "Tài liệu"}${metadata?.projectName ? ` trong ${metadata.projectName}` : ""}`,
      }
    case "Project":
      return {
        title: action === "created" ? "Dự án được tạo" : action === "updated" ? "Dự án cập nhật" : action === "deleted" ? "Dự án bị xóa" : "Hành động dự án",
        desc: metadata?.name || "Dự án",
      }
    case "User":
      return {
        title: action === "created" ? "Người dùng được tạo" : action === "updated" ? "Người dùng cập nhật" : "Hành động người dùng",
        desc: metadata?.name || metadata?.email || "Người dùng",
      }
    default:
      return { title: `${action} ${entityType}`, desc: "" }
  }
}

export function RecentActivity() {
  const { data: activity, isLoading } = useRecentActivity()

  if (isLoading) {
    return (
      <div className="p-5 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative pl-6">
            <Skeleton className="absolute left-[3px] top-1.5 w-1.5 h-1.5 rounded-full" />
            <Skeleton className="h-3 w-32 mb-1" />
            <Skeleton className="h-3 w-48 mb-1" />
            <Skeleton className="h-2 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="p-5 text-center py-10">
        <p className="text-sm text-slate-500">Không có hoạt động nào gần đây</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-y-auto p-5 space-y-6">
        {activity.slice(0, 10).map((item: ActivityItem, idx: number) => {
          const { title, desc } = getActivityDescription(item)
          const actorName = item.actor?.name || item.actor?.email || "Hệ thống"
          const dotColor = dotColorMap[item.action?.toLowerCase()] || "bg-slate-300 dark:bg-slate-600"
          const isLast = idx === Math.min(activity.length, 10) - 1

          return (
            <div key={item.id} className="relative pl-6">
              <div className={`absolute left-[3px] top-1.5 w-1.5 h-1.5 rounded-full ${dotColor}`} />
              {!isLast && (
                <div className="absolute left-[6px] top-3 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
              )}
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">{title}</p>
              <p className="text-[11px] text-slate-500 leading-normal mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{actorName}</span>
                {desc ? ` — ${desc}` : ""}
              </p>
              <p className="text-[10px] text-slate-400">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}
              </p>
            </div>
          )
        })}
      </div>
      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center mt-auto">
        <Button variant="link" className="text-[11px] font-bold text-slate-500 hover:text-blue-600 p-0 h-auto">
          Xem toàn bộ lịch sử
        </Button>
      </div>
    </>
  )
}
