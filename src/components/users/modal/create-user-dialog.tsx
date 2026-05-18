"use client"

import type React from "react"

import { useMemo, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRoles } from "@/modules/rbac/hooks"
import { useUsers } from "@/modules/rbac/hooks/useUsers"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { PermissionName } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {toast} from "react-toastify"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const colorMap: Record<string, string> = {
  ADMINISTRATOR: "text-red-400",
  DEV: "text-blue-400",
  TESTER: "text-green-400",
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    role: "",
    password: "",
    sendWelcomeEmail: true,
    requirePasswordChange: true,
  })
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string>("")
  const [createdUserEmail, setCreatedUserEmail] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const { data: roles } = useRoles()
  const { create } = useUsers()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password if provided
    if (formData.password && formData.password.length < 8) {
      alert("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }
    
    const result: any = await create.mutateAsync({
      username: formData.username,
      name: formData.name || undefined,
      email: formData.email || undefined,
      password: formData.password || undefined,
      // status implicit ACTIVE; if needed, add toggle in UI
      roleId: formData.role ? parseInt(formData.role) : undefined,
    })
    
    console.log("API Response:", result)
    console.log("User password:", formData.password)
    console.log("Temporary password:", result?.temporaryPassword)
    
    // If user provided a password, use that; otherwise show the generated temporary password
    const finalPassword = formData.password || result?.temporaryPassword || ""
    
    if (finalPassword) {
      setGeneratedPassword(finalPassword)
      setCreatedUserEmail(formData.username)
      setShowPasswordDialog(true)
    } else {
      // fallback: no password provided nor returned
      onOpenChange(false)
    }
    setFormData({ username: "", name: "", email: "", role: "", password: "", sendWelcomeEmail: true, requirePasswordChange: true })
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

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) setShowPasswordDialog(false); onOpenChange(v) }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[800px] max-h-[90vh] sm:max-h-[80vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg sm:text-xl">Thêm Người dùng Mới</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Tạo tài khoản mới và phân quyền cho người dùng
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                Tên đăng nhập <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => updateFormData("username", e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  className="pl-10 bg-muted/50 border-border"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Mật khẩu (tuỳ chọn)
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder="Tối thiểu 8 ký tự, để trống để tạo tự động"
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
              <Label htmlFor="name" className="text-foreground text-sm sm:text-base">
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

          {/* <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Gửi email chào mừng</Label>
                <p className="text-sm text-muted-foreground">Gửi hướng dẫn đăng nhập đến email người dùng</p>
              </div>
              <Switch
                checked={formData.sendWelcomeEmail}
                onCheckedChange={(checked) => updateFormData("sendWelcomeEmail", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Yêu cầu đổi mật khẩu</Label>
                <p className="text-sm text-muted-foreground">Bắt buộc người dùng đổi mật khẩu khi đăng nhập lần đầu</p>
              </div>
              <Switch
                checked={formData.requirePasswordChange}
                onCheckedChange={(checked) => updateFormData("requirePasswordChange", checked)}
              />
            </div>
          </div> */}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Hủy
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto" disabled={create.isPending}>
                Tạo Người dùng
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
      <DialogContent className="max-w-[95vw] sm:max-w-[460px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg sm:text-xl">Copy thông tin tài khoản mới</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {formData.password ? 
              "Hãy copy thông tin tài khoản mới." : 
              "Hãy copy thông tin tài khoản mới."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-foreground text-sm sm:text-base">Username | Password (để copy)</Label>
            <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input readOnly value={`${createdUserEmail} | ${generatedPassword}`} className="font-mono text-xs sm:text-sm" />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(`${createdUserEmail} | ${generatedPassword}`)
                  toast.success("Đã copy thông tin tài khoản mới")
                }}
                className="w-full sm:w-auto flex-shrink-0"
              >
                Sao chép
              </Button>
            </div>
          </div>
          
          <Separator />
          <p className="text-sm text-muted-foreground">
            {formData.password ? 
              "Người dùng có thể đăng nhập ngay với thông tin này." :
              "Người dùng cần đăng nhập với thông tin này và có thể đổi mật khẩu sau."
            }
          </p>
        </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => { setShowPasswordDialog(false); onOpenChange(false) }} className="w-full sm:w-auto">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
