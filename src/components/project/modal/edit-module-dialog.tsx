"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUpdateModule } from "@/modules/project/hooks/useUpdateModule"
import { toast } from "react-toastify"

interface EditModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string | null
  module: {
    id: string
    name: string
    description?: string
    status: "ACTIVE" | "INACTIVE"
  } | null
}

export function EditModuleDialog({ open, onOpenChange, projectId, module }: EditModuleDialogProps) {
  const updateMutation = useUpdateModule()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE")

  useEffect(() => {
    if (module) {
      setName(module.name || "")
      setDescription(module.description || "")
      setStatus(module.status || "ACTIVE")
    }
  }, [module])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!module || !projectId) return
    try {
      await updateMutation.mutateAsync({
        projectId,
        moduleId: module.id,
        name: name.trim(),
        description: description.trim(),
        status,
      })
      toast.success("Cập nhật module thành công")
      onOpenChange(false)
    } catch (err: any) {
      const message = err?.response?.data?.message || "Cập nhật module thất bại"
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] bg-white">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Module</DialogTitle>
          <DialogDescription>Cập nhật thông tin module hiện tại.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="module-name">Tên module *</Label>
            <Input id="module-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="module-description">Mô tả</Label>
            <Textarea id="module-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Trạng thái</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "ACTIVE" | "INACTIVE")}> 
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


