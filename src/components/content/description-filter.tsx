"use client"

import { useMemo, useState } from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export interface DescriptionFilterValue {
  key: string
  value: string
  operator: "equals" | "contains" | "startsWith" | "endsWith"
}

interface DescriptionFilterProps {
  data: any[]
  onFilterChange: (filters: DescriptionFilterValue[]) => void
  activeFilters: DescriptionFilterValue[]
}

export function DescriptionFilter({ data, onFilterChange, activeFilters }: DescriptionFilterProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string>("")
  const [filterValue, setFilterValue] = useState("")
  const [operator, setOperator] = useState<DescriptionFilterValue["operator"]>("contains")

  // Extract all unique keys from description JSON fields
  const availableKeys = useMemo(() => {
    const keysSet = new Set<string>()
    
    data.forEach((item) => {
      if (item.description && typeof item.description === 'object') {
        Object.keys(item.description).forEach((key) => {
          keysSet.add(key)
        })
      }
    })
    
    return Array.from(keysSet).sort()
  }, [data])

  const handleAddFilter = () => {
    if (!selectedKey || !filterValue) return
    
    const newFilter: DescriptionFilterValue = {
      key: selectedKey,
      value: filterValue,
      operator
    }
    
    onFilterChange([...activeFilters, newFilter])
    
    // Reset form
    setSelectedKey("")
    setFilterValue("")
    setOperator("contains")
    setShowDialog(false)
  }

  const handleRemoveFilter = (index: number) => {
    const newFilters = activeFilters.filter((_, i) => i !== index)
    onFilterChange(newFilters)
  }

  const getOperatorLabel = (op: DescriptionFilterValue["operator"]) => {
    switch (op) {
      case "equals": return "bằng"
      case "contains": return "chứa"
      case "startsWith": return "bắt đầu với"
      case "endsWith": return "kết thúc với"
      default: return op
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Active filters display */}
      {activeFilters.map((filter, index) => (
        <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1">
          <span className="text-xs">
            <span className="font-semibold">{filter.key}</span>
            {" "}{getOperatorLabel(filter.operator)}{" "}
            <span className="italic">"{filter.value}"</span>
          </span>
          <button
            onClick={() => handleRemoveFilter(index)}
            className="hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Add filter button */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={availableKeys.length === 0}
      >
        <Filter className="h-4 w-4 mr-2" />
        Lọc Mô tả
      </Button>

      {/* Filter dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[700px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Lọc theo Mô tả JSON</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Chọn trường và giá trị để lọc tài liệu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key" className="text-foreground">
                Trường trong JSON
              </Label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger id="key" className="bg-muted/50 border-border">
                  <SelectValue placeholder="Chọn trường..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator" className="text-foreground">
                Điều kiện
              </Label>
              <Select value={operator} onValueChange={(v) => setOperator(v as any)}>
                <SelectTrigger id="operator" className="bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Chứa</SelectItem>
                  <SelectItem value="equals">Bằng</SelectItem>
                  <SelectItem value="startsWith">Bắt đầu với</SelectItem>
                  <SelectItem value="endsWith">Kết thúc với</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value" className="text-foreground">
                Giá trị
              </Label>
              <Input
                id="value"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Nhập giá trị cần tìm..."
                className="bg-muted/50 border-border"
              />
            </div>

            {selectedKey && (
              <div className="border border-border rounded-md p-3 bg-muted/20">
                <p className="text-sm text-muted-foreground mb-2">Ví dụ giá trị có sẵn:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Array.from(new Set(
                    data
                      .map((item) => {
                        if (item.description && typeof item.description === 'object') {
                          const value = item.description[selectedKey]
                          if (value !== undefined && value !== null) {
                            return typeof value === 'object' ? JSON.stringify(value) : String(value)
                          }
                        }
                        return null
                      })
                      .filter(Boolean)
                      .slice(0, 5)
                  )).map((example, i) => (
                    <div key={i} className="text-xs text-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                      {String(example).length > 80 ? String(example).substring(0, 80) + "..." : String(example)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
              Hủy
            </Button>
            <Button 
              type="button" 
              onClick={handleAddFilter}
              disabled={!selectedKey || !filterValue}
              className="bg-primary hover:bg-primary/90"
            >
              Thêm Bộ lọc
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function to apply filters to data
export function applyDescriptionFilters<T extends { description?: any }>(
  data: T[],
  filters: DescriptionFilterValue[]
): T[] {
  if (filters.length === 0) return data

  return data.filter((item) => {
    if (!item.description || typeof item.description !== 'object') {
      return false
    }

    return filters.every((filter) => {
      const value = item.description[filter.key]
      if (value === undefined || value === null) return false

      const stringValue = typeof value === 'object' 
        ? JSON.stringify(value).toLowerCase() 
        : String(value).toLowerCase()
      const filterValue = filter.value.toLowerCase()

      switch (filter.operator) {
        case "equals":
          return stringValue === filterValue
        case "contains":
          return stringValue.includes(filterValue)
        case "startsWith":
          return stringValue.startsWith(filterValue)
        case "endsWith":
          return stringValue.endsWith(filterValue)
        default:
          return false
      }
    })
  })
}

