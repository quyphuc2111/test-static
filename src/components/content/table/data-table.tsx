"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ContentContextMenu } from "./context-menu"
import { ContentItem } from "./columns"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import { ScrollBar } from "@/components/ui/scroll-area"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  showColumnVisibility?: boolean
  showPagination?: boolean
  pageSize?: number
  className?: string
  // Context menu actions (optional)
  contextMenuActions?: {
    onView?: (content: ContentItem) => void
    onCopyUrl?: (content: ContentItem) => void
    onShowSCORMInfo?: (content: ContentItem) => void
    onEdit?: (content: ContentItem) => void
    onDownload?: (content: ContentItem) => void
    onRestore?: (content: ContentItem) => void
    onUploadFile?: (content: ContentItem) => void
    onUpdateFile?: (content: ContentItem) => void
    onSoftDelete?: (content: ContentItem) => void
    onHardDelete?: (content: ContentItem) => void
    copiedUrl?: string | null
    isDownloading?: boolean
    isRestoring?: boolean
    isUploading?: boolean
    isUpdating?: boolean
    isSoftDeleting?: boolean
    isHardDeleting?: boolean
    currentUserId?: string
  }
  // Bulk actions (optional)
  bulkActions?: {
    onBulkDelete?: (selectedItems: ContentItem[]) => void
    isBulkDeleting?: boolean
  }
  showSelection?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Tìm kiếm...",
  showColumnVisibility = true,
  showPagination = true,
  pageSize = 10,
  className = "",
  contextMenuActions,
  bulkActions,
  showSelection = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Helper function to check if content has SCORM info
  const hasSCORMInfo = (content: any) => {
    if (content.contentType === "FILE_ZIP_SCORM" && content.description) {
      const desc = content.description
      if (typeof desc === 'object' && desc) return desc.scorm || null
      try {
        const parsed = JSON.parse(desc)
        return parsed.scorm || null
      } catch {
        return null
      }
    }
    return null
  }

  // Add selection column if enabled
  const columnsWithSelection = React.useMemo(() => {
    if (!showSelection) return columns

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chọn hàng"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    }

    return [selectionColumn, ...columns]
  }, [columns, showSelection])

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  })

  // Get selected rows
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedItems = selectedRows.map(row => row.original as ContentItem)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 pt-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {searchKey && (
            <div className="relative w-full sm:w-auto">
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
                className="w-full sm:max-w-sm"
              />
            </div>
          )}
        </div>
        {showColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full sm:w-auto">
                Cột <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {String(column.id)}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Bulk Actions */}
      {/* {showSelection && bulkActions && selectedItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/50 p-3 rounded-lg border mx-4 sm:mx-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {selectedItems.length} mục đã chọn
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => bulkActions.onBulkDelete?.(selectedItems)}
              disabled={bulkActions.isBulkDeleting}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {bulkActions.isBulkDeleting ? "Đang xóa..." : `Xóa ${selectedItems.length} mục`}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.toggleAllPageRowsSelected(false)}
              className="w-full sm:w-auto"
            >
              Bỏ chọn tất cả
            </Button>
          </div>
        </div>
      )} */}

      {/* Table */}
      <div className="w-full overflow-x-auto">
          <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const content = row.original as ContentItem
                const scormInfo = hasSCORMInfo(content)
                
                if (contextMenuActions) {
                  return (
                    <ContentContextMenu
                      key={row.id}
                      content={content}
                      onView={contextMenuActions.onView!}
                      onCopyUrl={contextMenuActions.onCopyUrl!}
                      onShowSCORMInfo={contextMenuActions.onShowSCORMInfo!}
                      onEdit={contextMenuActions.onEdit!}
                      onDownload={contextMenuActions.onDownload!}
                      onRestore={contextMenuActions.onRestore!}
                      onUploadFile={contextMenuActions.onUploadFile}
                      onUpdateFile={contextMenuActions.onUpdateFile}
                      onSoftDelete={contextMenuActions.onSoftDelete}
                      onHardDelete={contextMenuActions.onHardDelete}
                      copiedUrl={contextMenuActions.copiedUrl || null}
                      isDownloading={contextMenuActions.isDownloading || false}
                      isRestoring={contextMenuActions.isRestoring || false}
                      isUploading={contextMenuActions.isUploading || false}
                      isUpdating={contextMenuActions.isUpdating || false}
                      isSoftDeleting={contextMenuActions.isSoftDeleting || false}
                      isHardDeleting={contextMenuActions.isHardDeleting || false}
                      hasSCORMInfo={!!scormInfo}
                      currentUserId={contextMenuActions.currentUserId}
                    >
                      <TableRow
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </ContentContextMenu>
                  )
                }
                
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không có kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Hiển thị {table.getFilteredRowModel().rows.length} trong tổng số{" "}
            {data.length} mục.
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-center">
              <p className="text-sm font-medium whitespace-nowrap">Hàng mỗi trang</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center justify-center text-sm font-medium whitespace-nowrap">
                Trang {table.getState().pagination.pageIndex + 1} /{" "}
                {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Đi đến trang đầu</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Trang trước</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Trang tiếp</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Đi đến trang cuối</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
