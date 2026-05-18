"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRoles } from "@/modules/rbac/hooks"
import { useUserRoles } from "@/modules/rbac/hooks/useUserRoles"
import { toast } from "react-toastify"
import { Shield, X } from "lucide-react"

interface AssignRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
}

export function AssignRoleDialog({ open, onOpenChange, user }: AssignRoleDialogProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")

  const { data: roles, isLoading: rolesLoading } = useRoles()
  const { data: userRoles, isLoading: userRolesLoading, assign: assignRoleMut, remove: removeRoleMut } = useUserRoles(user?.id)

  const userRoleIds = userRoles?.map(ur => ur.roleId) || []
  const availableRoles = roles?.filter(role => !userRoleIds.includes(role.id)) || []

  const handleAssignRole = () => {
    if (!selectedRoleId || !user) return

    assignRoleMut.mutate(
      {
        userId: user.id,
        roleId: Number(selectedRoleId) as any,
      },
      {
        onSuccess: () => {
          toast.success("Gán vai trò thành công")
          setSelectedRoleId("")
        },
        onError: (error: any) => {
          toast.error(error.message || "Gán vai trò thất bại")
        },
      }
    )
  }

  const handleRemoveRole = (roleId: string) => {
    if (!user) return

    if (confirm("Bạn có chắc chắn muốn gỡ vai trò này?")) {
      removeRoleMut.mutate(
        {
          userId: user.id,
          roleId: Number(roleId) as any,
        },
        {
          onSuccess: () => {
            toast.success("Gỡ vai trò thành công")
          },
          onError: (error: any) => {
            toast.error(error.message || "Gỡ vai trò thất bại")
          },
        }
      )
    }
  }

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case "ADMINISTRATOR":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Quản trị viên</Badge>
      case "DEV":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Nhà phát triển</Badge>
      case "TESTER":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Người kiểm thử</Badge>
      default:
        return <Badge variant="secondary">{roleName}</Badge>
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý Vai trò - {user.name || user.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Roles */}
          <div>
            <h3 className="text-lg font-medium mb-4">Vai trò hiện tại</h3>
            {userRolesLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Đang tải vai trò...
              </div>
            ) : userRoles && userRoles.length > 0 ? (
              <div className="space-y-2">
                {userRoles.map((userRole: any) => (
                  <div key={userRole.roleId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{userRole.role?.name}</div>
                        {userRole.role?.description && (
                          <div className="text-sm text-muted-foreground">
                            {userRole.role.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(userRole.role?.name || "")}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRole(userRole.roleId)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Người dùng chưa có vai trò nào
              </div>
            )}
          </div>

          {/* Assign New Role */}
          <div>
            <h3 className="text-lg font-medium mb-4">Gán vai trò mới</h3>
            {rolesLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Đang tải danh sách vai trò...
              </div>
            ) : availableRoles.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {availableRoles.map((role: any) => (
                    <div 
                      key={role.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRoleId === role.id.toString() 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedRoleId(role.id.toString())}
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{role.name}</div>
                          {role.description && (
                            <div className="text-sm text-muted-foreground">
                              {role.description}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {role.permissions?.length || 0} quyền hạn
                          </div>
                        </div>
                      </div>
                      {getRoleBadge(role.name)}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Không có vai trò nào để gán
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {selectedRoleId && (
            <Button 
              onClick={handleAssignRole}
              disabled={assignRoleMut.isPending}
            >
              {assignRoleMut.isPending ? "Đang gán..." : "Gán vai trò"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
