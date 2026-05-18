"use client"

import { useMemo, useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { UsersTable } from "@/components/users/table"
import { buildUserColumns } from "@/components/users/table/columns"
import { CreateUserDialog } from "./modal/create-user-dialog"
import { EditUserDialog } from "./modal/edit-user-dialog"
import { DeleteUserDialog } from "./modal/delete-user-dialog"
import { AssignRoleDialog } from "./modal/assign-role-dialog"
import { ResetPasswordDialog } from "./modal/reset-password-dialog"
import { useUsers } from "@/modules/rbac/hooks/useUsers"
import { useTablePagination } from "@/hooks/useTablePagination"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { PermissionName } from "@prisma/client"

export function UserManagement() {
  // Local state for dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  const {
    page,
    pageSize,
    searchTerm,
    setPage,
    handleSearchChange,
    handlePageSizeChange,
    tableProps
  } = useTablePagination({
    defaultPage: 1,
    defaultPageSize: 10,
    defaultSearch: ""
  })
  
  const { data: usersResp, isLoading, remove, toggleStatus } = useUsers({ page, pageSize, search: searchTerm })
  const users = usersResp?.data
  const pagination = usersResp?.pagination

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setShowEditDialog(true)
  }

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const handleAssignRole = (user: any) => {
    setSelectedUser(user)
    setShowAssignRoleDialog(true)
  }

  const handleToggleStatus = async (user: any) => {
    try {
      await toggleStatus.mutateAsync(user.id)
      const action = user.status === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt"
      toast.success(`Đã ${action} tài khoản thành công!`)
    } catch (error) {
      console.error("Error toggling user status:", error)
      toast.error("Có lỗi xảy ra khi thay đổi trạng thái tài khoản")
    }
  }

  const handleResetPassword = (user: any) => {
    setSelectedUser(user)
    setShowResetPasswordDialog(true)
  }

  const columns = useMemo(() => buildUserColumns({
    onEdit: handleEditUser,
    onAssignRole: handleAssignRole,
    onResetPassword: handleResetPassword,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDeleteUser,
    toggling: toggleStatus.isPending,
  }), [toggleStatus.isPending])

  const tableData = useMemo(() => {
    if (!users) return []

    return users.map((u: any) => ({
      ...u,
      id: Number(u.id),
      roles: Array.isArray(u.roles)
        ? u.roles.map((r: any) => ({ ...r, roleId: Number(r.roleId) }))
        : u.roles,
    }))
  }, [users])

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Quản lý Người dùng</h2>
          <p className="text-sm md:text-base text-muted-foreground">Quản lý tài khoản và quyền truy cập của người dùng</p>
        </div>
        <PermissionGuard permission={PermissionName.CREATE_USERS}>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90 w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Thêm Người dùng
          </Button>
        </PermissionGuard>
      </div>

     <div className="w-[calc(100vw-2rem)] md:w-full">
     <UsersTable
        columns={columns}
        data={tableData as any}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        total={pagination?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />
     </div>

      <CreateUserDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <EditUserDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
        user={selectedUser} 
      />
      <DeleteUserDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
        user={selectedUser} 
      />
      <AssignRoleDialog 
        open={showAssignRoleDialog} 
        onOpenChange={setShowAssignRoleDialog} 
        user={selectedUser} 
      />
      <ResetPasswordDialog 
        open={showResetPasswordDialog} 
        onOpenChange={setShowResetPasswordDialog} 
        user={selectedUser} 
      />
    </div>
  )
}
