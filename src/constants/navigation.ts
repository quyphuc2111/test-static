import {
  FileText,
  Users,
  Settings,
  LayoutDashboard,
  Shield,
  Share2,
} from "lucide-react"
import { PermissionName } from "@prisma/client"

export type NavigationItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permissions?: PermissionName[]
}

export const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permissions: [PermissionName.VIEW_DASHBOARD_STATS, PermissionName.VIEW_AUDIT_LOGS]
  },
  {
    name: "Quản lý Dự án",
    href: "/project",
    icon: Settings,
    permissions: [
      PermissionName.VIEW_PROJECTS,
      PermissionName.CREATE_PROJECTS,
      PermissionName.EDIT_PROJECTS,
      PermissionName.SOFT_DELETE_PROJECTS,
      PermissionName.HARD_DELETE_PROJECTS
    ]
  }, 
  // {
  //   name: "Quản lý Nội dung",
  //   href: "/content",
  //   icon: FileText,
  //   permissions: [PermissionName.VIEW_CONTENT, PermissionName.VIEW_OWN_CONTENT_ONLY]
  // },
  {
    name: "Quản lý Người dùng",
    href: "/users",
    icon: Users,
    permissions: [
      PermissionName.VIEW_USERS,
      PermissionName.CREATE_USERS,
      PermissionName.EDIT_USERS,
      PermissionName.SOFT_DELETE_USERS,
      PermissionName.HARD_DELETE_USERS
    ]
  },
  {
    name: "Quản lý Quyền hạn",
    href: "/rbac",
    icon: Shield,
    permissions: [PermissionName.MANAGE_USER_PERMISSIONS]
  },
  // {
  //   name: "Chia sẻ Nội dung",
  //   href: "/content-sharing",
  //   icon: Share2,
  //   permissions: [PermissionName.SHARE_CONTENT_ACCESS]
  // }
]

