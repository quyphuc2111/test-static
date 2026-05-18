"use client"

import { useMemo, useState } from "react"
import { Package, Share2, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { useModules } from "@/modules/project/hooks/useModules"
import { ModulesTable } from "./table/modules-table"

export function ModuleSharing() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  const { projects, isLoading: projectsLoading } = useProjects()
  const { data: modules, isLoading: modulesLoading } = useModules(selectedProjectId, !!selectedProjectId)

  const moduleList = useMemo(() => {
    return (modules || []).map((m: any) => ({ id: m.id, name: m.name }))
  }, [modules])

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid gap-3 sm:grid-cols-2 w-full lg:w-auto">
          <div className="space-y-1">
            <Label>Dự án</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="bg-muted/50 border-border">
                <SelectValue placeholder="Chọn dự án" />
              </SelectTrigger>
              <SelectContent>
                {projectsLoading ? (
                  <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                ) : (projects || []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Module</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{modules?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Trong dự án này</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tài liệu Chia sẻ</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground">Theo phạm vi module</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Người dùng Truy cập</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-blue-400">Theo từng lần chia sẻ</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg sm:text-xl">Danh sách Module</CardTitle>
        </CardHeader>
        <CardContent className="w-[calc(100vw-2rem)] md:w-full">
          {!selectedProjectId ? (
            <div className="text-center py-8 text-muted-foreground">
              Vui lòng chọn dự án để xem danh sách module
            </div>
          ) : (
            <ModulesTable modules={moduleList} isLoading={modulesLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
