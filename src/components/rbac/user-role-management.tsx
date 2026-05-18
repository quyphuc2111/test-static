"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, UserCog, Shield, History, Mail } from "lucide-react"
import { useUsers, useRoles } from "@/modules/rbac/hooks"
import { AssignRoleDialog } from "./modal/assign-role-dialog"

// Mock role history data - in real app this would come from API
const roleHistory = [
  {
    id: 1,
    user: "Trần Thị B",
    action: "Thay đổi vai trò",
    from: "Editor",
    to: "Content Manager",
    by: "Nguyễn Văn A",
    date: "2024-03-15 14:30",
  },
  {
    id: 2,
    user: "Lê Văn C",
    action: "Gán vai trò",
    from: "-",
    to: "Editor",
    by: "Nguyễn Văn A",
    date: "2024-03-14 10:15",
  },
  {
    id: 3,
    user: "Phạm Thị D",
    action: "Thay đổi vai trò",
    from: "Viewer",
    to: "Reviewer",
    by: "Trần Thị B",
    date: "2024-03-13 16:45",
  },
]

export function UserRoleManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const { data: usersResponse, isLoading: usersLoading } = useUsers()
  const { data: roles, isLoading: rolesLoading } = useRoles()

  const users = usersResponse?.data || []

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    const matchesRole = filterRole === "all" || 
      (user.roles?.some((userRole: any) => userRole.role?.name === filterRole) || false)
    return matchesSearch && matchesRole
  })

  const handleChangeRole = (user: any) => {
    setSelectedUser(user)
    setIsChangeRoleDialogOpen(true)
  }

  const getRoleBadge = (roleName: string) => {
    const colorMap: { [key: string]: string } = {
      "ADMINISTRATOR": "red",
      "DEV": "blue", 
      "TESTER": "green"
    }
    const color = colorMap[roleName] || "gray"
    
    return (
      <Badge variant="outline" className={`border-${color}-500 text-${color}-600`}>
        {roleName}
      </Badge>
    )
  }

  if (usersLoading || rolesLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Đang tải danh sách người dùng...
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Lọc theo vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            {roles?.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Danh sách người dùng</CardTitle>
          <CardDescription className="text-sm">Quản lý vai trò và quyền hạn của từng người dùng</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="table-scroll-container">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  {/* <TableHead>Phòng ban</TableHead> */}
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Ngày gán</TableHead>
                  <TableHead>Đăng nhập cuối</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="/placeholder.svg" alt={user.name || user.username || ""} />
                        <AvatarFallback>
                          {(user.name || user.username || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name || user.username || "Chưa có tên"}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                        {user.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
                      </div>
                    </div>
                  </TableCell>
                  {/* <TableCell>IT</TableCell> */}
                  <TableCell>
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((userRole: any) => (
                        <div key={userRole.roleId}>
                          {getRoleBadge(userRole.role?.name || "")}
                        </div>
                      ))
                    ) : (
                      <Badge variant="outline">Chưa có vai trò</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">2 giờ trước</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "ACTIVE" ? "secondary" : "outline"}>
                      {user.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setTimeout(() => handleChangeRole(user), 0)}>
                          <UserCog className="h-4 w-4 mr-2" />
                          Đổi vai trò
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Xem quyền hạn
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <History className="h-4 w-4 mr-2" />
                          Lịch sử thay đổi
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Gửi thông báo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Lịch sử thay đổi vai trò</CardTitle>
          <CardDescription className="text-sm">Theo dõi các thay đổi vai trò gần đây</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {roleHistory.map((history) => (
              <div key={history.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 rounded-lg border">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm sm:text-base">{history.user}</span>
                    <span className="text-muted-foreground hidden sm:inline">•</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{history.action}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    {history.from !== "-" && (
                      <>
                        <Badge variant="outline" className="text-xs">{history.from}</Badge>
                        <span className="text-xs">→</span>
                      </>
                    )}
                    <Badge variant="secondary" className="text-xs">{history.to}</Badge>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs sm:text-sm text-muted-foreground space-y-0.5">
                  <div>Bởi {history.by}</div>
                  <div>{history.date}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg">Thay đổi vai trò</DialogTitle>
            <DialogDescription className="text-sm">Thay đổi vai trò cho người dùng {selectedUser?.name || selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vai trò hiện tại</label>
              <div className="p-3 rounded-lg bg-muted">
                <Badge variant="outline">
                  {selectedUser?.roles?.[0]?.role?.name || "Chưa có vai trò"}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Vai trò mới</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò mới" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    ?.filter((role) => role.name !== selectedUser?.roles?.[0]?.role?.name)
                    .map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeRoleDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => setIsChangeRoleDialogOpen(false)}>Xác nhận thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
