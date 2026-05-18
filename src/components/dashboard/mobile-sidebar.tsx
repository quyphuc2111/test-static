"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/modules/auth/hooks/useAuth"
import { useUserPermissions } from "@/modules/rbac/hooks"
import { navigation, type NavigationItem } from "@/constants/navigation"

interface MobileSidebarProps {
  onClose?: () => void
}

export function MobileSidebar({ onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const { user: me, logout } = useAuth()
  const { hasAnyPermission } = useUserPermissions()

  const filteredNavigation = navigation.filter((item: NavigationItem) => {
    if (item.permissions && item.permissions.length > 0) {
      return hasAnyPermission(item.permissions)
    }
    return true
  })

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
            SC
          </div>
          <h1 className="font-bold text-base leading-tight tracking-tight text-slate-900 dark:text-white uppercase">
            Static Server
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-lg",
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${me?.name || me?.email || "User"}`} />
            <AvatarFallback>{(me?.name || me?.email || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold truncate dark:text-slate-200">{me?.email || me?.name || ""}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              {me?.roles?.[0]?.name || "User"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-9"
          onClick={() => { logout(); onClose?.() }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Đăng xuất</span>
        </Button>
      </div>
    </div>
  )
}
