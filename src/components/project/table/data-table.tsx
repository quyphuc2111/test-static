"use client"

import { useState, Fragment } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getExpandedRowModel,
  ExpandedState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react"
import { Project, createColumns } from "./columns"
import { ModuleManagementDialog } from "../modal/module-management-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditModuleDialog } from "../modal/edit-module-dialog"
import { DeleteModuleDialog } from "../modal/delete-module-dialog"
import { ModuleContentCount } from "./module-content-count"

interface DataTableProps {
  data: Project[]
  onDelete: (projectId: string) => void
}

export function DataTable({ data, onDelete }: DataTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [managingModules, setManagingModules] = useState<Project | null>(null)
  const [editingModule, setEditingModule] = useState<any | null>(null)
  const [deletingModule, setDeletingModule] = useState<any | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const columns = createColumns({ onDelete })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    state: {
      expanded,
    },
  })

  return (
    <>
      <ScrollArea className="w-full whitespace-nowrap border-t">
        <Table className="relative" style={{ minWidth: '550px' }}>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => {
                    const isActionColumn = header.id === 'actions'
                    const isExpandColumn = header.id === 'expand'
                    const meta = header.column.columnDef.meta as any
                    return (
                      <TableHead 
                        key={header.id} 
                        style={{ width: header.getSize() }}
                        className={`
                          ${meta?.className || ''}
                          ${isActionColumn ? 'sticky right-0 bg-muted/50 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] z-10' : ''}
                          ${isExpandColumn ? 'sticky left-0 bg-muted/50 z-10' : ''}
                        `}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow 
                      key={row.id} 
                      className={`group hover:bg-muted/50 cursor-pointer ${row.original.isDeleted ? 'bg-red-50/30' : ''}`}
                      onClick={() => row.toggleExpanded()}
                    >
                      {row.getVisibleCells().map((cell, index) => {
                        const isActionColumn = cell.column.id === 'actions'
                        const isExpandColumn = cell.column.id === 'expand'
                        const meta = cell.column.columnDef.meta as any
                        return (
                          <TableCell 
                            key={cell.id}
                            className={`
                              ${meta?.className || ''}
                              ${isActionColumn ? 'sticky right-0 bg-background group-hover:bg-muted/50 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] z-10' : ''}
                              ${isExpandColumn ? 'sticky left-0 bg-background group-hover:bg-muted/50 z-10' : ''}
                              ${row.original.isDeleted && isActionColumn ? 'bg-red-50/30 group-hover:bg-red-50/50' : ''}
                              ${row.original.isDeleted && isExpandColumn ? 'bg-red-50/30 group-hover:bg-red-50/50' : ''}
                            `}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/50 p-0">
                          <div className="p-4 sm:pl-16">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                              <h4 className="text-sm font-semibold">Module trong dự án</h4>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setManagingModules(row.original)
                                }}
                                className="gap-2 w-full sm:w-auto"
                              >
                                <Plus className="h-3 w-3" />
                                Thêm Module
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {row.original.modules && row.original.modules.length > 0 ? (
                                row.original.modules.map((module: any) => (
                                  <div
                                    key={module.id}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border ${module.isDeleted ? 'bg-red-50/40 border-red-200' : 'bg-card'}`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-sm break-words">{module.name}</span>
                                        <Badge variant={module.status === "ACTIVE" ? "default" : "secondary"} className="flex-shrink-0">
                                          {module.status === "ACTIVE" ? "Đang hoạt động" : "Tạm dừng"}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 break-words">
                                        {module.description || "Không có mô tả"}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                      <ModuleContentCount moduleId={module.id} />
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => { setSelectedProjectId(row.original.id); setEditingModule(module) }}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Chỉnh sửa
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedProjectId(row.original.id); setDeletingModule(module) }}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Xóa
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Chưa có module nào trong dự án này
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {managingModules && (
        <ModuleManagementDialog
          project={managingModules}
          open={!!managingModules}
          onOpenChange={(open: boolean) => !open && setManagingModules(null)}
        />
      )}
      <EditModuleDialog
        open={!!editingModule}
        onOpenChange={(open: boolean) => { if (!open) { setEditingModule(null); setSelectedProjectId(null) } }}
        projectId={selectedProjectId}
        module={editingModule}
      />
      <DeleteModuleDialog
        open={!!deletingModule}
        onOpenChange={(open: boolean) => { if (!open) { setDeletingModule(null); setSelectedProjectId(null) } }}
        projectId={selectedProjectId}
        module={deletingModule}
      />
    </>
  )
}
