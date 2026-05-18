"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Lock, RefreshCw, Eye, EyeOff, CheckCircle } from "lucide-react"
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
import { useUsers } from "@/modules/rbac/hooks/useUsers"
import { toast } from "react-toastify"

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
}

export function ResetPasswordDialog({ open, onOpenChange, user }: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { resetPassword } = useUsers()

  useEffect(() => {
    if (!open) {
      setNewPassword("")
      setConfirmPassword("")
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }, [open])

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
    const length = 12
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(result)
    setConfirmPassword(result)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp")
      return
    }

    try {
      await resetPassword.mutateAsync({
        userId: user.id,
        newPassword
      })
      toast.success(`Đã đặt lại mật khẩu cho ${user.username}`)
      onOpenChange(false)
    } catch (error) {
      console.error("Reset password error:", error)
      toast.error("Có lỗi xảy ra khi đặt lại mật khẩu")
    }
  }

  if (!user) return null

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const isPasswordValid = newPassword.length >= 8

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[450px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2 text-lg sm:text-xl">
            <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Đặt lại Mật khẩu
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Đặt mật khẩu mới cho <span className="font-medium text-foreground">{user.username}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-foreground">
              Mật khẩu mới <span className="text-red-400">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="pl-10 pr-10 bg-muted/50 border-border"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
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
            {newPassword && (
              <p className={`text-sm ${isPasswordValid ? 'text-green-400' : 'text-red-400'}`}>
                {isPasswordValid ? '✓ Mật khẩu hợp lệ' : 'Mật khẩu phải có ít nhất 8 ký tự'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">
              Xác nhận mật khẩu <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="pl-10 pr-10 bg-muted/50 border-border"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {confirmPassword && (
              <p className={`text-sm ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                {passwordsMatch ? '✓ Mật khẩu khớp' : 'Mật khẩu không khớp'}
              </p>
            )}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Lưu ý:</strong> Mật khẩu mới sẽ được áp dụng ngay lập tức. 
              Người dùng sẽ cần sử dụng mật khẩu mới để đăng nhập.
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={resetPassword.isPending}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
              disabled={resetPassword.isPending || !isPasswordValid || !passwordsMatch}
            >
              {resetPassword.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang đặt lại...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Đặt lại Mật khẩu
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

