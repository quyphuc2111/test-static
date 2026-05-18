"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { useCreateModule } from "@/modules/project/hooks/useCreateModule"
import { toast } from "react-toastify"
import { FolderPlus } from "lucide-react"

interface CreateModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function CreateModuleDialog({ open, onOpenChange, projectId }: CreateModuleDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE")

  const createMutation = useCreateModule()

  const resetForm = () => {
    setName("")
    setDescription("")
    setStatus("ACTIVE")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await createMutation.mutateAsync({
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      })
      toast.success("Đã tạo module mới")
      resetForm()
      onOpenChange(false)
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message
      const fallbackMessage = err?.message
      toast.error(apiMessage || fallbackMessage || "Không thể tạo module")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-blue-600" />
            Tạo Module mới
          </DialogTitle>
          <DialogDescription>
            Thêm module mới vào dự án để tổ chức nội dung.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="module-name">Tên module <span className="text-red-500">*</span></Label>
            <Input
              id="module-name"
              placeholder="Nhập tên module..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white dark:bg-slate-900"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="module-desc">Mô tả</Label>
            <Textarea
              id="module-desc"
              placeholder="Mô tả ngắn về module (tùy chọn)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white dark:bg-slate-900 resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "ACTIVE" | "INACTIVE")}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { resetForm(); onOpenChange(false) }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Đang tạo..." : "Tạo module"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
