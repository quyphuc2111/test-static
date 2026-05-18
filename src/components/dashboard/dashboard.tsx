"use client"

import { StatsCards } from "./stats-cards"
import { RecentActivity } from "./recent-activity"
import { useDashboard } from "@/modules/dashboard/hooks"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function Dashboard() {
  const { stats, isLoading } = useDashboard()

  return (
    <div className="flex flex-col gap-8 h-full animate-in fade-in duration-500">
      {/* Page header */}
      <div className="shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Tổng quan hệ thống quản lý tài liệu</p>
      </div>

      {/* Stats */}
      <StatsCards />

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        {/* Quick stats */}
        <div className="flex-1 flex flex-col min-h-0">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Thống kê nhanh</h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500">Tài liệu mới hôm nay</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{stats?.content.today || 0}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500">Tài liệu tuần này</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{stats?.content.thisWeek || 0}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-500">Tài liệu tháng này</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{stats?.content.thisMonth || 0}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="w-full lg:w-80 flex flex-col shrink-0 min-h-0">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Hoạt động gần đây</h2>
          <div className="bg-white dark:bg-slate-900 flex-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <RecentActivity />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
