"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Shield, X, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRoles } from "@/modules/rbac/hooks"
import { useUserRoles } from "@/modules/rbac/hooks/useUserRoles"
import { toast } from "react-toastify"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserWithRoles } from "@/modules/rbac/rbac.interface"

interface AssignRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserWithRoles
}

export function AssignRoleDialog({ open, onOpenChange, user }: AssignRoleDialogProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const { data: allRoles } = useRoles()
  const { data: userRoles, assign, remove } = useUserRoles(user?.id?.toString())

  useEffect(() => {
    if (!open) {
      setSelectedRoleId("")
    }
  }, [open])

  if (!user) return null

  const userRoleIds = (userRoles || []).map((ur) => ur.roleId)
  const availableRoles = (allRoles || []).filter((role) => !userRoleIds.includes(role.id))
  const assignedRoles = (allRoles || []).filter((role) => userRoleIds.includes(role.id))

  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      toast.error("Vui lòng chọn vai trò")
      return
    }

    try {
      await assign.mutateAsync({
        userId: user.id,
        roleId: Number(selectedRoleId),
      })
      toast.success("Gán vai trò thành công!")
      setSelectedRoleId("")
    } catch (error) {
      console.error("Assign role error:", error)
      toast.error("Có lỗi xảy ra khi gán vai trò")
    }
  }

  const handleRemoveRole = async (roleId: string) => {
    try {
      await remove.mutateAsync({
        userId: user.id.toString(),
        roleId: roleId,
      })
      toast.success("Gỡ vai trò thành công!")
    } catch (error) {
      console.error("Remove role error:", error)
      toast.error("Có lỗi xảy ra khi gỡ vai trò")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="h-5 w-5 text-primary" />
            Phân Quyền cho Người dùng
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm sm:text-base">
            Quản lý vai trò của <span className="font-medium text-foreground">{user.name || user.email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assigned Roles Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Label className="text-foreground text-base font-medium">Vai trò hiện tại</Label>
              <Badge variant="outline" className="text-xs w-fit">
                {assignedRoles.length} vai trò
              </Badge>
            </div>
            
            {assignedRoles.length > 0 ? (
              <ScrollArea className="h-[250px] sm:h-[300px] rounded-md border border-border p-2 sm:p-3">
                <div className="space-y-2">
                  {assignedRoles.map((role) => (
                    <Card key={role.id} className="border-border bg-primary/5">
                      <CardContent className="p-2 sm:p-3">
                        <div className="flex items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground text-xs sm:text-sm truncate">{role.name}</h4>
                              {role.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1">{role.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-8 sm:w-8 text-red-400 hover:text-red-500 hover:bg-red-400/10 flex-shrink-0"
                            onClick={() => handleRemoveRole(role.id.toString())}
                            disabled={remove.isPending}
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="border border-dashed border-border rounded-md p-6 sm:p-8 text-center">
                <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-muted-foreground">Chưa có vai trò nào được gán</p>
              </div>
            )}
          </div>

          {/* Add New Role Section */}
          {availableRoles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-foreground text-base font-medium">Thêm vai trò mới</Label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1">
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger className="bg-muted/50 border-border h-10 sm:h-11">
                      <SelectValue placeholder="Chọn vai trò để gán..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-medium text-sm">{role.name}</span>
                            {role.description && (
                              <span className="text-xs text-muted-foreground hidden sm:inline">- {role.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={handleAssignRole}
                  disabled={!selectedRoleId || assign.isPending}
                  className="bg-primary hover:bg-primary/90 h-10 sm:h-11 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{assign.isPending ? "Đang gán..." : "Gán"}</span>
                  <span className="sm:hidden">{assign.isPending ? "..." : "Gán"}</span>
                </Button>
              </div>
            </div>
          )}

          {availableRoles.length === 0 && assignedRoles.length > 0 && (
            <div className="border border-border rounded-md p-3 sm:p-4 bg-muted/20">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>Người dùng đã được gán tất cả vai trò có sẵn</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

