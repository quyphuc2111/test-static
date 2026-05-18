"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, FolderOpen } from "lucide-react"
import { ActionButtons } from "./action-buttons"

export interface Project {
  id: string
  name: string
  description?: string
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
  isDeleted: boolean
  deletedAt?: string | null
  modules?: any[]
  createdAt: string
  updatedAt: string
}

interface ProjectTableProps {
  onDelete: (projectId: string) => void
}

export function createColumns({ onDelete }: ProjectTableProps): ColumnDef<Project>[] {
  return [
    {
      id: "expand",
      header: "",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              row.toggleExpanded()
            }}
          >
            {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )
      },
      size: 50,
    },
    {
      accessorKey: "name",
      header: "Tên Dự án",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 min-w-[140px]">
          <FolderOpen className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
          <span className={`font-medium text-sm ${row.original.isDeleted ? 'line-through text-muted-foreground' : ''}`}>
            {row.getValue("name")}
          </span>
          {row.original.isDeleted && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0 flex-shrink-0">Xóa</Badge>
          )}
        </div>
      ),
      size: 160,
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => (
        <div className="max-w-[120px] truncate">
          <span className="text-muted-foreground text-xs">
            {row.getValue("description") || "—"}
          </span>
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const project = row.original
        
        // Nếu đã xóa mềm, hiển thị trạng thái "Đã xóa" với màu đỏ
        if (project.isDeleted) {
          return <Badge variant="destructive" className="text-xs">Đã xóa</Badge>
        }
        
        // Nếu chưa xóa, hiển thị trạng thái gốc
        const status = project.status
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
          ACTIVE: { variant: "default", label: "Hoạt động" },
          INACTIVE: { variant: "secondary", label: "Tạm dừng" },
          ARCHIVED: { variant: "outline", label: "Lưu trữ" },
        }
        const config = variants[status] || variants.ACTIVE
        return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
      },
      size: 100,
    },
    {
      id: "modules",
      header: "Module",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.modules?.length || 0}
        </Badge>
      ),
      size: 80,
    },
    {
      accessorKey: "updatedAt",
      header: "Cập nhật",
      cell: ({ row }) => {
        const project = row.original
        
        // Nếu đã xóa mềm, hiển thị thời gian xóa
        if (project.isDeleted && project.deletedAt) {
          return (
            <div className="text-muted-foreground text-xs whitespace-nowrap">
              <div className="text-red-600 font-medium text-[10px]">Đã xóa</div>
              <div>{new Date(project.deletedAt).toLocaleDateString("vi-VN", {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
              })}</div>
            </div>
          )
        }
        
        // Nếu chưa xóa, hiển thị thời gian cập nhật
        return (
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {new Date(project.updatedAt).toLocaleDateString("vi-VN", {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            })}
          </span>
        )
      },
      size: 90,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <ActionButtons project={row.original} onDelete={onDelete} />,
      size: 50,
    },
  ]
}
