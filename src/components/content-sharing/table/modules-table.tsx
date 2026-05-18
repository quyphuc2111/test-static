"use client"

import { useState, useEffect, useRef } from "react"
import { MoreHorizontal, Edit, Trash2, Share2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ModuleShareDialog } from "../modal/module-share-dialog"

interface Module {
  id: string
  name: string
}

interface ModulesTableProps {
  modules: Module[]
  isLoading?: boolean
}

export function ModulesTable({ modules, isLoading }: ModulesTableProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
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
  }, [modules])

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

  const handleShareClick = (module: Module) => {
    setSelectedModule(module)
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
          <Table className="min-w-[500px]">
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">Tên Module</TableHead>
              <TableHead className="text-muted-foreground">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border">
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  Đang tải module...
                </TableCell>
              </TableRow>
            ) : modules.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  Không có module nào
                </TableCell>
              </TableRow>
            ) : (
              modules.map((module) => (
                <TableRow key={module.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{module.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareClick(module)}
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

      {selectedModule && (
        <ModuleShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          moduleId={selectedModule.id}
          moduleName={selectedModule.name}
        />
      )}
    </>
  )
}

