import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RoleManagement } from "./role-management"
import { PermissionsMatrix } from "./permissions-matrix"

function RoleBaseManagement() {
  return (
    <div className="space-y-4 md:space-y-6">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Quản lý Quyền hạn</h1>
      <p className="text-sm md:text-base text-muted-foreground">Quản lý vai trò và quyền hạn trong hệ thống</p>
    </div>

    <Tabs defaultValue="roles" className="space-y-4 md:space-y-6">
      <TabsList className="grid w-full sm:w-2/3 md:w-1/2 lg:w-1/3 grid-cols-2">
        <TabsTrigger value="roles" className="text-xs sm:text-sm">Vai trò & Quyền hạn</TabsTrigger>
        <TabsTrigger value="matrix" className="text-xs sm:text-sm">Bảng phân quyền</TabsTrigger>

      </TabsList>

      <TabsContent value="roles" className="space-y-6">
        <RoleManagement />
      </TabsContent>

      <TabsContent value="matrix" className="space-y-6">
        <PermissionsMatrix />
      </TabsContent>
    </Tabs>
  </div>
  )
}

export default RoleBaseManagement