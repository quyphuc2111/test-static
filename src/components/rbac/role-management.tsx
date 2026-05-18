"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "../ui/separator"
import { Plus, MoreHorizontal, Edit, Trash2, Copy, Shield, Users, Lock, Unlock, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRoles, useDeleteRole, usePermissions, useUpdateRole, useCreateRole, useCloneRole, useToggleRoleStatus } from "@/modules/rbac/hooks"
import { CreateRoleDialog } from "./modal/create-role-dialog"
import { EditRoleDialog } from "./modal/edit-role-dialog"
import { PermissionGuard } from "./permission-guard"
import { PermissionName } from "@prisma/client"

const buildPermissionCategories = (allPermissions: Array<{ id: string, name: string, description?: string, nameVi?: string }>) => {
  const categories = [
    {
      name: "Content Management",
      match: (n: string) => n.includes("CONTENT") || n.includes("SHARE"),
    },
    {
      name: "Project/Module Management",
      match: (n: string) => n.includes("PROJECT") || n.includes("MODULE"),
    },
    {
      name: "User Management",
      match: (n: string) => n.includes("USER"),
    },
    {
      name: "Audit & Dashboard",
      match: (n: string) => n.includes("AUDIT") || n.includes("DASHBOARD"),
    },
  ] as const

  return categories.map(cat => ({
    name: cat.name,
    permissions: allPermissions
      .filter(p => cat.match(p.name))
      .map(p => ({ id: p.id, name: p.name, description: p.description, nameVi: p.nameVi }))
  }))
}

export function RoleManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [roleName, setRoleName] = useState("")
  const [roleDescription, setRoleDescription] = useState("")

  const { data: roles, isLoading } = useRoles()
  const { data: permissions } = usePermissions()
  const deleteRoleMut = useDeleteRole()
  const updateRoleMut = useUpdateRole()
  const createRoleMut = useCreateRole()
  const cloneRoleMut = useCloneRole()
  const toggleStatusMut = useToggleRoleStatus()

  const filteredRoles = roles?.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false),
  ) || []

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId],
    )
  }

  const handleDeleteRole = (roleId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa vai trò này?")) {
      deleteRoleMut.mutate(Number(roleId) as any)
    }
  }

  const handleEditRole = (role: any) => {
    setSelectedRole(role)
    setSelectedPermissions(role.permissions?.map((rp: any) => rp.permissionId) || [])
    setRoleName(role.name || "")
    setRoleDescription(role.description || "")
    setIsCreateDialogOpen(true)
  }

  const handleCloneRole = (roleId: string) => {
    if (confirm("Bạn có muốn nhân bản vai trò này?")) {
      cloneRoleMut.mutate(Number(roleId) as any)
    }
  }

  const handleToggleStatus = (roleId: string) => {
    toggleStatusMut.mutate(Number(roleId) as any)
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Đang tải danh sách vai trò...
      </div>
    )
  }

  const permissionCategories = buildPermissionCategories(permissions || [] as any)

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full md:w-auto">
          <Input
            placeholder="Tìm kiếm vai trò..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{roles?.length || 0} vai trò</span>
          </div>
        </div>
        <PermissionGuard permission={PermissionName.MANAGE_USER_PERMISSIONS}>
          <Dialog 
            open={isCreateDialogOpen} 
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open)
              if (!open) {
                setSelectedRole(null)
                setSelectedPermissions([])
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedRole(null)
                setSelectedPermissions([])
                setRoleName("")
                setRoleDescription("")
                setIsCreateDialogOpen(true)
              }} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Tạo vai trò mới</span>
                <span className="sm:hidden">Tạo mới</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:!max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  {selectedRole ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}
                </DialogTitle>
                <DialogDescription>
                  {selectedRole ? "Cập nhật thông tin và quyền hạn cho vai trò" : "Tạo vai trò mới và phân quyền chi tiết cho vai trò đó"}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role-name">Tên vai trò *</Label>
                      <Input 
                        id="role-name" 
                        placeholder="Ví dụ: Content Manager"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role-description">Mô tả</Label>
                      <Textarea 
                        id="role-description" 
                        placeholder="Mô tả chi tiết về vai trò này..." 
                        rows={3}
                        value={roleDescription}
                        onChange={(e) => setRoleDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Trạng thái</Label>
                        <p className="text-sm text-muted-foreground">Kích hoạt vai trò ngay sau khi tạo</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Phân quyền chi tiết</Label>
                      <Button variant="outline" size="sm" onClick={() => setSelectedPermissions([])}>
                        Bỏ chọn tất cả
                      </Button>
                    </div>

                    {permissionCategories.map((category) => (
                      <div key={category.name} className="space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {category.name}
                        </h4>
                        <div className="space-y-2 pl-6">
                          {category.permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-start space-x-3 p-2 rounded-lg hover:bg-accent"
                            >
                              <Checkbox
                                id={permission.id}
                                checked={selectedPermissions.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <div className="flex-1 space-y-1">
                                <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                                  {permission.name}
                                </Label>
                                <Label htmlFor={permission.id} className="text-xs text-muted-foreground">{permission.nameVi}</Label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false)
                  setSelectedRole(null)
                  setSelectedPermissions([])
                }}>
                  Hủy
                </Button>
                <Button onClick={() => {
                  if (selectedRole) {
                    updateRoleMut.mutate({
                      roleId: selectedRole.id,
                      payload: {
                        name: roleName,
                        description: roleDescription,
                        permissionIds: selectedPermissions.map(id => Number(id) as any),
                      }
                    })
                  } else {
                    createRoleMut.mutate({
                      name: roleName,
                      description: roleDescription,
                      permissionIds: selectedPermissions.map(id => Number(id) as any),
                    })
                  }
                  setIsCreateDialogOpen(false)
                  setSelectedRole(null)
                  setSelectedPermissions([])
                  setRoleName("")
                  setRoleDescription("")
                }}>
                  {selectedRole ? "Cập nhật vai trò" : "Tạo vai trò"} ({selectedPermissions.length} quyền)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PermissionGuard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoles.map((role) => {
          const isSystem = role.name === "ADMINISTRATOR"
          const colorMap: { [key: string]: string } = {
            "ADMINISTRATOR": "red",
            "DEV": "blue", 
            "TESTER": "green"
          }
          const color = colorMap[role.name] || "gray"
          
          return (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full bg-${color}-500`} />
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {role.name}
                        {isSystem && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Hệ thống
                          </Badge>
                        )}
                        {!role.isActive && (
                          <Badge variant="destructive" className="text-xs">
                            Vô hiệu hóa
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{role.description}</CardDescription>
                    </div>
                  </div>
                  <PermissionGuard permission="MANAGE_USER_PERMISSIONS">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setTimeout(() => handleEditRole(role), 0)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setTimeout(() => handleCloneRole(role.id.toString()), 0)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Nhân bản
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setTimeout(() => handleToggleStatus(role.id.toString()), 0)}
                          disabled={isSystem}
                        >
                          {role.isActive ? (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Vô hiệu hóa
                            </>
                          ) : (
                            <>
                              <Unlock className="h-4 w-4 mr-2" />
                              Kích hoạt
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          disabled={isSystem}
                          onSelect={() => setTimeout(() => handleDeleteRole(role.id.toString()), 0)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa vai trò
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Người dùng</span>
                    <Badge variant="secondary">{role.users?.length || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quyền hạn</span>
                    <Badge variant="secondary">{role.permissions?.length || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ngày tạo</span>
                    <span className="text-sm">{new Date(role.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedRole && selectedRole.name === "ADMINISTRATOR" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vai trò hệ thống không thể chỉnh sửa hoặc xóa. Bạn có thể nhân bản vai trò này để tạo vai trò tùy chỉnh.
          </AlertDescription>
        </Alert>
      )}

    </div>
  )
}
