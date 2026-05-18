"use client"

import { useMemo, useRef, useState } from "react"
import { Search, Users, FolderOpen, Share2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { ProjectsTable } from "./table/projects-table"

export function ProjectSharing() {
  const [searchTerm, setSearchTerm] = useState("")
  const { projects, isLoading: projectsLoading } = useProjects()

  const filteredProjects = useMemo(() => {
    const list: { id: string; name: string; createdAt?: string | Date }[] = (projects || []).map((p: any) => ({ 
      id: p.id, 
      name: p.name, 
      createdAt: p.createdAt 
    }))
    return list.filter((project) => project.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [projects, searchTerm])

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm dự án..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Dự án</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{projects?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Tổng số dự án</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tài liệu Chia sẻ</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground">Theo phạm vi dự án</p>
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
          <CardTitle className="text-foreground text-lg sm:text-xl">Danh sách Dự án</CardTitle>
        </CardHeader>
        <CardContent className="w-[calc(100vw-2rem)] md:w-full">
          <ProjectsTable projects={filteredProjects} isLoading={projectsLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
