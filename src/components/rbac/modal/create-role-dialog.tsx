"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useCreateRole, usePermissions } from "@/modules/rbac/hooks"
import { toast } from "react-toastify"

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const { data: permissions, isLoading: permissionsLoading } = usePermissions()
  const createRoleMut = useCreateRole()

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

    createRoleMut.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        permissionIds: selectedPermissions.map(id => Number(id) as any),
      },
      {
        onSuccess: () => {
          toast.success("Tạo vai trò thành công")
          onOpenChange(false)
          setName("")
          setDescription("")
          setSelectedPermissions([])
        },
        onError: (error: any) => {
          toast.error(error.message || "Tạo vai trò thất bại")
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Tạo Vai trò Mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 overflow-y-auto flex-1 px-1">
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

          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Quyền hạn *</Label>
              <span className="text-xs text-muted-foreground">
                {selectedPermissions.length} quyền đã chọn
              </span>
            </div>
            {permissionsLoading ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Đang tải danh sách quyền hạn...
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4 max-h-[40vh] md:max-h-60 overflow-y-auto border rounded-lg p-3 md:p-4 bg-muted/30">
                {groupedPermissions && Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm text-foreground uppercase tracking-wide sticky top-0 bg-muted/50 backdrop-blur-sm py-1 -mx-1 px-1 rounded">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-2 p-2 rounded hover:bg-accent/50 transition-colors">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.id, checked as boolean)
                            }
                            className="mt-0.5"
                          />
                          <Label 
                            htmlFor={permission.id}
                            className="text-xs sm:text-sm font-normal cursor-pointer flex-1 leading-relaxed"
                          >
                            <span className="font-medium">{permission.name}</span>
                            {permission.description && (
                              <span className="block text-muted-foreground text-xs mt-0.5">
                                {permission.description}
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

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-4 border-t mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={createRoleMut.isPending || !name.trim() || selectedPermissions.length === 0}
              className="w-full sm:w-auto"
            >
              {createRoleMut.isPending ? "Đang tạo..." : `Tạo vai trò (${selectedPermissions.length})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
