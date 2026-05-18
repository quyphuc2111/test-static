"use client"

import { useState, useEffect, useRef } from "react"
import { MoreHorizontal, Edit, Trash2, Share2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProjectShareDialog } from "../modal/project-share-dialog"

interface Project {
  id: string
  name: string
  createdAt?: string | Date
}

interface ProjectsTableProps {
  projects: Project[]
  isLoading?: boolean
}

export function ProjectsTable({ projects, isLoading }: ProjectsTableProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showScrollHint, setShowScrollHint] = useState(true)
  const [canScroll, setCanScroll] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current
        setCanScroll(scrollWidth > clientWidth)
      }
    }
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [projects])

  useEffect(() => {
    if (canScroll) {
      const timer = setTimeout(() => setShowScrollHint(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [canScroll])

  const handleScroll = () => {
    if (showScrollHint) {
      setShowScrollHint(false)
    }
  }

  const handleShareClick = (project: Project) => {
    setSelectedProject(project)
    setShareDialogOpen(true)
  }

  return (
    <>
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="table-scroll-container"
          onScroll={handleScroll}
        >
          <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">Tên Dự án</TableHead>
              <TableHead className="text-muted-foreground">Ngày tạo</TableHead>
              <TableHead className="text-muted-foreground">Trạng thái</TableHead>
              <TableHead className="text-muted-foreground">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border">
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Đang tải dự án...
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Không có dự án nào
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{project.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString('vi-VN') : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Hoạt động</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareClick(project)}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Chia sẻ</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
        
        {canScroll && showScrollHint && (
          <div className="md:hidden absolute bottom-4 right-4 bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-bounce">
            <span>Vuốt để xem thêm</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        )}
      </div>

      {selectedProject && (
        <ProjectShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}
    </>
  )
}

