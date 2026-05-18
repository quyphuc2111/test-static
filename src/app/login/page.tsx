"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/modules/auth/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth(true)
  const router = useRouter()
  const [loginInput, setLoginInput] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disabledNotice, setDisabledNotice] = useState(false)

  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      return searchParams.get('redirect') || '/project'
    }
    return '/project'
  }

  useEffect(() => {
    if (isAuthenticated) {
      router.push(getRedirectUrl())
    }
  }, [isAuthenticated, router])

  // Hiển thị thông báo nếu bị redirect do tài khoản bị vô hiệu hoá
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get('reason') === 'disabled') {
        setDisabledNotice(true)
        // Xoá query param để không hiện lại khi refresh
        const url = new URL(window.location.href)
        url.searchParams.delete('reason')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login({ login: loginInput, password })
      router.push(getRedirectUrl())
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Đăng nhập thất bại")
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Chào mừng trở lại</CardTitle>
          <CardDescription>
            Đăng nhập vào hệ thống quản lý Static Content Server
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {disabledNotice && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tài khoản của bạn đã bị vô hiệu hoá. Vui lòng liên hệ quản trị viên.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="login">Tên đăng nhập hoặc Email</Label>
              <Input
                id="login"
                type="text"
                placeholder="admin@example.com"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                required
                className="bg-white/50 dark:bg-slate-950/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/50 dark:bg-slate-950/50"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
