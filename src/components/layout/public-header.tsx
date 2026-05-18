"use client"

import { Moon, Sun, Menu, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import Link from "next/link"

interface PublicHeaderProps {
  onMenuClick?: () => void
}

export function PublicHeader({ onMenuClick }: PublicHeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isDark = (resolvedTheme ?? theme) === "dark"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-accent"
            onClick={onMenuClick}
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SC</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold text-foreground">Static Content Server</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Tính năng
            </Link>
            <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              Giới thiệu
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Chuyển đổi giao diện"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="hover:bg-accent"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Login Button */}
          <Link href="/login">
            <Button className="gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

