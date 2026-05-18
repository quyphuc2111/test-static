"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { toast } from "react-toastify"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { createProject } = useProjects()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Tên dự án là bắt buộc")
      return
    }

    setLoading(true)
    try {
      await createProject({
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: "ACTIVE",
        modules: []
      })
      
      toast.success(`Dự án "${formData.name}" đã được tạo.`)

      onOpenChange(false)
      setFormData({ name: "", description: "" })
    } catch (error: any) {
      const message = error?.response?.data?.message || "Tạo dự án thất bại"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", description: "" })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-[500px] bg-white" data-testid="create-project-dialog">
        <DialogHeader>
          <DialogTitle>Tạo Dự án Mới</DialogTitle>
          <DialogDescription>Tạo một dự án mới để quản lý tài liệu và module</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên dự án <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="Nhập tên dự án..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="create-project-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả về dự án..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="create-project-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="create-project-cancel">
              Hủy
            </Button>
            <Button type="submit" disabled={loading} data-testid="create-project-submit">
              {loading ? "Đang tạo..." : "Tạo Dự án"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
