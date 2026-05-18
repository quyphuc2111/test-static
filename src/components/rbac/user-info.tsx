"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useUserPermissions } from "@/modules/rbac/hooks/useUserPermissions"

export function UserInfo() {
  const { user, isAdmin, isDeveloper, isTester } = useUserPermissions()

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin người dùng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-medium">
                {(user.name || user.username || user.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">{user.name || user.username || "Chưa có tên"}</h3>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Vai trò</h4>
            <div className="flex flex-wrap gap-2">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge key={role.id} variant="secondary">
                    {role.name}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">Chưa có vai trò</Badge>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Quyền hạn ({user.permissions?.length || 0})</h4>
            <div className="max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {user.permissions && user.permissions.length > 0 ? (
                  user.permissions.map((permission) => (
                    <Badge key={permission.id} variant="outline" className="text-xs">
                      {permission.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Không có quyền hạn</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Trạng thái hệ thống</h4>
            <div className="flex flex-wrap gap-2">
              {isAdmin && <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Administrator</Badge>}
              {isDeveloper && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Developer</Badge>}
              {isTester && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Tester</Badge>}
              {!isAdmin && !isDeveloper && !isTester && (
                <Badge variant="outline">Người dùng thường</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
