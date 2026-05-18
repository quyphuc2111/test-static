"use client"

import { useDashboard } from "@/modules/dashboard/hooks"
import { Skeleton } from "@/components/ui/skeleton"

export function StatsCards() {
  const { stats, isLoading } = useDashboard()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500">Không thể tải dữ liệu thống kê</p>
        </div>
      </div>
    )
  }

  const statsData = [
    { title: "Dự án hoạt động", value: stats.projects.active.toLocaleString() },
    { title: "Tổng tài liệu", value: stats.content.total.toLocaleString() },
    { title: "Tổng Module", value: stats.modules.total.toLocaleString() },
    { title: "Người dùng", value: stats.users.total.toLocaleString() },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
      {statsData.map((stat, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{stat.title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
