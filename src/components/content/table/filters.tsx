"use client"

import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Search, Filter, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface FilterOption {
  value: string
  label: string
}

interface FiltersProps<TData> {
  table: Table<TData>
  searchKey?: string
  searchPlaceholder?: string
  showColumnVisibility?: boolean
  statusFilter?: {
    key: string
    options: FilterOption[]
  }
  typeFilter?: {
    key: string
    options: FilterOption[]
  }
  onClearFilters?: () => void
}

export function Filters<TData>({
  table,
  searchKey,
  searchPlaceholder = "Tìm kiếm...",
  showColumnVisibility = true,
  statusFilter,
  typeFilter,
  onClearFilters
}: FiltersProps<TData>) {
  const hasActiveFilters = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between space-y-2 flex-wrap gap-2">
      <div className="flex items-center space-x-2 flex-wrap">
        {/* Search */}
        {searchKey && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-10 w-80"
            />
          </div>
        )}

        {/* Status Filter */}
        {statusFilter && (
          <Select
            value={(table.getColumn(statusFilter.key)?.getFilterValue() as string) ?? ""}
            onValueChange={(value) =>
              table.getColumn(statusFilter.key)?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {statusFilter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Type Filter */}
        {typeFilter && (
          <Select
            value={(table.getColumn(typeFilter.key)?.getFilterValue() as string) ?? ""}
            onValueChange={(value) =>
              table.getColumn(typeFilter.key)?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Loại nội dung" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {typeFilter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && onClearFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-2 lg:px-3"
          >
            <X className="mr-2 h-4 w-4" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center space-x-1 flex-wrap">
              {table.getState().columnFilters.map((filter) => {
                const column = table.getColumn(filter.id)
                if (!column) return null
                
                const headerText = typeof column.columnDef.header === 'string' 
                  ? column.columnDef.header 
                  : filter.id
                
                return (
                  <Badge key={filter.id} variant="secondary" className="text-xs">
                    {headerText}: {String(filter.value)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => column.setFilterValue("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )
              })}
          </div>
        )}

        {/* Column Visibility */}
        {showColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Filter className="mr-2 h-4 w-4" />
                Cột
                <ChevronDown className="ml-2 h-4 w-4" />
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
    </div>
  )
}
