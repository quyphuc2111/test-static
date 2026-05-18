"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { User, Mail, Shield, RefreshCw, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRoles } from "@/modules/rbac/hooks"
import { useUsers } from "@/modules/rbac/hooks/useUsers"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-toastify"

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
}

const colorMap: Record<string, string> = {
  ADMINISTRATOR: "text-red-400",
  DEV: "text-blue-400",
  TESTER: "text-green-400",
}

export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    role: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const { data: roles } = useRoles()
  const { update } = useUsers()

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        name: user.name || "",
        email: user.email || "",
        role: user.roles?.[0]?.role?.id.toString() || "",
        password: "",
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password if provided
    if (formData.password && formData.password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }
    
    try {
      await update.mutateAsync({
        id: user.id,
        name: formData.name || undefined,
        email: formData.email || undefined,
        password: formData.password || undefined,
        roleId: formData.role ? parseInt(formData.role) : undefined,
      })
      
      toast.success("Cập nhật người dùng thành công!")
      onOpenChange(false)
    } catch (error) {
      console.error("Update user error:", error)
      toast.error("Có lỗi xảy ra khi cập nhật người dùng")
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
    const length = 12
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    updateFormData("password", result)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[800px] max-h-[90vh] sm:max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg sm:text-xl">Chỉnh sửa Người dùng</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Cập nhật thông tin và quyền của người dùng
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                Tên đăng nhập
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  value={formData.username}
                  className="pl-10 bg-muted/30 border-border cursor-not-allowed"
                  disabled
                  title="Username không thể thay đổi"
                />
              </div>
              <p className="text-xs text-muted-foreground">Username không thể thay đổi sau khi tạo</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Mật khẩu mới (tuỳ chọn)
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder="Để trống nếu không đổi mật khẩu"
                    className="bg-muted/50 border-border pr-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateStrongPassword}
                  title="Tạo mật khẩu mạnh"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {formData.password && formData.password.length < 8 && (
                <p className="text-sm text-red-400">Mật khẩu phải có ít nhất 8 ký tự</p>
              )}
              {formData.password && formData.password.length >= 8 && (
                <p className="text-sm text-green-400">✓ Mật khẩu hợp lệ</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Họ và tên
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Nhập họ và tên (tùy chọn)"
                  className="pl-10 bg-muted/50 border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email (tùy chọn)
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="Nhập email (tùy chọn)"
                  className="pl-10 bg-muted/50 border-border"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-foreground">
              Vai trò
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <Select value={formData.role} onValueChange={(value) => updateFormData("role", value)}>
                <SelectTrigger className="pl-10 bg-muted/50 border-border w-full">
                  <SelectValue placeholder="Chọn vai trò..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {(roles || []).map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">- {role.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Hủy
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto" disabled={update.isPending}>
              {update.isPending ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
