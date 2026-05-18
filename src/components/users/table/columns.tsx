"use client"

import React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Shield, Key, UserCheck, UserX, Trash2 } from "lucide-react"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { PermissionName } from "@prisma/client"
import type { UserRow } from "./index"
import { formatDate, formatDateTime } from "@/utils"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Hoạt động</Badge>
    case "DISABLED":
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Không hoạt động</Badge>
    default:
      return <Badge variant="secondary">Khác</Badge>
  }
}

interface ActionsProps {
  row: UserRow
  onEdit: (user: UserRow) => void
  onAssignRole: (user: UserRow) => void
  onResetPassword: (user: UserRow) => void
  onToggleStatus: (user: UserRow) => Promise<void> | void
  onDelete: (user: UserRow) => void
  toggling?: boolean
}

const ActionsCell: React.FC<ActionsProps> = ({ row, onEdit, onAssignRole, onResetPassword, onToggleStatus, onDelete, toggling }) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <PermissionGuard permission={PermissionName.EDIT_USERS}>
          <DropdownMenuItem onSelect={() => setTimeout(() => onEdit(row), 0)}>
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </DropdownMenuItem>
        </PermissionGuard>
        <PermissionGuard permission={PermissionName.MANAGE_USER_PERMISSIONS}>
          <DropdownMenuItem onSelect={() => setTimeout(() => onAssignRole(row), 0)}>
            <Shield className="mr-2 h-4 w-4" />
            Phân quyền
          </DropdownMenuItem>
        </PermissionGuard>
        <PermissionGuard permission={PermissionName.EDIT_USERS}>
          <DropdownMenuItem onSelect={() => setTimeout(() => onResetPassword(row), 0)}>
            <Key className="mr-2 h-4 w-4" />
            Đặt lại mật khẩu
          </DropdownMenuItem>
        </PermissionGuard>
        <DropdownMenuSeparator />
        <PermissionGuard permission={PermissionName.EDIT_USERS}>
          {row.status === "ACTIVE" ? (
            <DropdownMenuItem onSelect={() => setTimeout(() => onToggleStatus(row), 0)} disabled={toggling}>
              <UserX className="mr-2 h-4 w-4" />
              Vô hiệu hóa
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setTimeout(() => onToggleStatus(row), 0)} disabled={toggling}>
              <UserCheck className="mr-2 h-4 w-4" />
              Kích hoạt
            </DropdownMenuItem>
          )}
        </PermissionGuard>
        <PermissionGuard permission={PermissionName.HARD_DELETE_USERS}>
          <DropdownMenuItem className="text-red-400" onSelect={() => setTimeout(() => onDelete(row), 0)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa
          </DropdownMenuItem>
        </PermissionGuard>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function buildUserColumns(handlers: Omit<ActionsProps, "row" | "toggling"> & { toggling?: boolean }): ColumnDef<UserRow, any>[] {
  return [
    {
      accessorKey: "name",
      header: "Người dùng",
      cell: ({ row }) => {
        const user = row.original
        const display = user.name || user.username
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={"/placeholder.svg"} alt={display || ''} />
              <AvatarFallback>{(display || '').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-foreground">{display}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => <span className="text-muted-foreground font-mono text-sm">{row.original.username}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.email || "—"}</span>,
    },
    {
      id: "roles",
      header: "Vai trò",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles && row.original.roles.length > 0 ? (
            row.original.roles.map((userRole) => (
              <Badge key={userRole.roleId} variant="secondary" className="text-xs">
                {userRole.role?.name || "Unknown"}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground italic">Chưa có vai trò</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{formatDateTime(row.original.createdAt)}</span>,
    },
    {
      accessorKey: "updatedAt",
      header: "Ngày cập nhật",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{formatDateTime(row.original.updatedAt)}</span>,
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <ActionsCell
          row={row.original}
          onEdit={handlers.onEdit}
          onAssignRole={handlers.onAssignRole}
          onResetPassword={handlers.onResetPassword}
          onToggleStatus={handlers.onToggleStatus}
          onDelete={handlers.onDelete}
          toggling={handlers.toggling}
        />
      ),
    },
  ]
}


