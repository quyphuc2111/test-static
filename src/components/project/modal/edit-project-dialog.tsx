"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { toast } from "react-toastify"

interface Project {
  id: string
  name: string
  description?: string
  status: string
}

interface EditProjectDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const { updateProject } = useProjects()
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
    status: project.status,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status,
    })
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Tên dự án là bắt buộc")
      return
    }

    setLoading(true)
    try {
      await updateProject(project.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status as "ACTIVE" | "INACTIVE" | "ARCHIVED",
      })

      toast.success(`Dự án "${formData.name}" đã được cập nhật.`)

      onOpenChange(false)
    } catch (error: any) {
      const message = error?.response?.data?.message || "Cập nhật dự án thất bại"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[90vh] flex flex-col bg-white">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Chỉnh sửa Dự án</DialogTitle>
          <DialogDescription>Cập nhật thông tin dự án</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Tên dự án *</Label>
                <Input
                  id="edit-name"
                  placeholder="Nhập tên dự án..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Mô tả về dự án..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Trạng thái</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                    <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
                    <SelectItem value="ARCHIVED">Đã lưu trữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </ScrollArea>
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading} onClick={handleSubmit}>
            {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}