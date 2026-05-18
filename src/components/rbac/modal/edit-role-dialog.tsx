"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useUpdateRole, usePermissions } from "@/modules/rbac/hooks"
import { toast } from "react-toastify"

interface EditRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: any
}

export function EditRoleDialog({ open, onOpenChange, role }: EditRoleDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const { data: permissions, isLoading: permissionsLoading } = usePermissions()
  const updateRoleMut = useUpdateRole()

  useEffect(() => {
    if (role) {
      setName(role.name || "")
      setDescription(role.description || "")
      setSelectedPermissions(role.permissions?.map((rp: any) => rp.permissionId) || [])
    }
  }, [role])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Tên vai trò là bắt buộc")
      return
    }

    if (selectedPermissions.length === 0) {
      toast.error("Vui lòng chọn ít nhất một quyền hạn")
      return
    }

    updateRoleMut.mutate(
      {
        roleId: role.id,
        payload: {
          name: name.trim(),
          description: description.trim() || undefined,
          permissionIds: selectedPermissions.map(id => Number(id) as any),
        },
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật vai trò thành công")
          onOpenChange(false)
        },
        onError: (error: any) => {
          toast.error(error.message || "Cập nhật vai trò thất bại")
        },
      }
    )
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId])
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId))
    }
  }

  const groupedPermissions = permissions?.reduce((acc, permission) => {
    const category = permission.name.split('_')[0] || 'OTHER'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, any[]>)

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Vai trò</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tên vai trò *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên vai trò"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả vai trò"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Quyền hạn *</Label>
            {permissionsLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Đang tải danh sách quyền hạn...
              </div>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                {groupedPermissions && Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {perms.map((permission: any) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={permission.id}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {permission.name}
                            {permission.description && (
                              <span className="text-muted-foreground ml-2">
                                - {permission.description}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={updateRoleMut.isPending || !name.trim() || selectedPermissions.length === 0}
            >
              {updateRoleMut.isPending ? "Đang cập nhật..." : "Cập nhật vai trò"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
