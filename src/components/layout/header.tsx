"use client"

import { Moon, Sun, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/modules/auth/hooks/useAuth"
import { navigation } from "@/constants/navigation"

interface HeaderProps {
  onMenuClick?: () => void
}

function useCurrentPageName() {
  const pathname = usePathname()
  const matched = navigation.find(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(item.href + "/") ||
      (item.href === "/project" && pathname.startsWith("/projects"))
  )
  return matched?.name || "Dashboard"
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isDark = (resolvedTheme ?? theme) === "dark"
  const { user: me } = useAuth()
  const pageName = useCurrentPageName()

  return (
    <header className="flex h-16 items-center border-b bg-white px-4 md:px-8 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shrink-0 justify-between">
      <div className="flex items-center gap-4 text-sm">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-accent"
          onClick={onMenuClick}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <nav className="hidden lg:flex items-center gap-4 text-sm">
          <span className="text-slate-400">Home</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{pageName}</span>
        </nav>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
       
        <Button
          variant="ghost"
          size="icon"
          aria-label="Chuyển đổi giao diện"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="hover:bg-accent"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        {/* <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
        </Button> */}
        <div className="flex items-center gap-3 border-l pl-4 border-slate-200 dark:border-slate-800">
          <div className="text-sm text-right hidden sm:block">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {me?.name || me?.email || "User"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">
              {me?.roles?.[0]?.name || "USER"}
            </div>
          </div>
          <Avatar className="h-9 w-9 border border-slate-200">
            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${me?.name || me?.email || "User"}`} />
            <AvatarFallback>{(me?.name || me?.email || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
