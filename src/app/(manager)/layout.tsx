"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/modules/auth/hooks/useAuth"
import { useUserSSE } from "@/modules/auth/hooks/useUserSSE"

export default function ManagerPage({children}: {children: React.ReactNode}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()

  // SSE: lắng nghe event user bị vô hiệu hoá → force logout realtime (1 connection duy nhất)
  useUserSSE(user?.id)

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      
      {/* Mobile Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTitle></SheetTitle>
        <SheetContent side="left" className="w-64 p-0">
          <MobileSidebar onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex w-full flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
          <div className="w-full h-full max-w-full mx-auto flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
