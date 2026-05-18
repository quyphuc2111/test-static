import httpService from "@/services/instance"

const DASHBOARD_API_URL = {
  STATS: "dashboard/stats",
  ACTIVITY: "dashboard/activity"
} as const

export interface DashboardStats {
  projects: {
    total: number
    active: number
    archived: number
  }
  modules: {
    total: number
    active: number
    inactive: number
  }
  content: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    growthRate: number
  }
  users: {
    total: number
  }
  recent: {
    projects: Array<{
      id: string
      name: string
      description?: string
      status: string
      updatedAt: string
      _count: {
        modules: number
        contentData: number
      }
    }>
    content: Array<{
      id: string
      title: string
      contentType: string
      status: string
      updatedAt: string
      project: { name: string }
      module: { name: string }
      owner: { name?: string; email: string }
    }>
  }
}

export interface ActivityItem {
  id: string
  type: 'audit' | 'content' | 'project' | 'user'
  action: string
  entityType: string
  entityId: string
  actor: {
    id: string
    name?: string
    email: string
  } | null
  createdAt: string
  metadata: any
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await httpService.get<{ data: DashboardStats }>({ 
    url: DASHBOARD_API_URL.STATS 
  })
  return res.data
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const res = await httpService.get<{ data: ActivityItem[] }>({ 
    url: DASHBOARD_API_URL.ACTIVITY 
  })
  return res.data
}
