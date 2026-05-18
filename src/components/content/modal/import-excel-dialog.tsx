"use client"

import { useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import * as XLSX from "xlsx"
import { useImportContent } from "@/modules/content/hooks/useImportContent"
import { toast } from "react-toastify"

interface ImportExcelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  moduleId: string
}

export function ImportExcelDialog({ open, onOpenChange, projectId, moduleId }: ImportExcelDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [rows, setRows] = useState<Array<{ title: string; description?: any }>>([])
  const [errors, setErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>("")

  const importMut = useImportContent(projectId, moduleId)

  const canSubmit = !!projectId && !!moduleId && rows.length > 0 && errors.length === 0 && !importMut.isPending

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ["title", "mota_key1", "mota_key2"],
      ["Tiêu đề 1", "giá trị 1", "giá trị 2"],
    ])
    XLSX.utils.book_append_sheet(wb, ws, "Template")
    XLSX.writeFile(wb, "content_import_template.xlsx")
  }

  const validateRows = (items: Array<{ title: string; description?: any }>) => {
    const errs: string[] = []
    if (!projectId || !moduleId) {
      errs.push("Vui lòng chọn Dự án và Module trước khi nhập")
    }
    if (items.length === 0) {
      errs.push("File không có dòng dữ liệu hợp lệ")
    }
    const seenTitles = new Set<string>()
    items.forEach((r, idx) => {
      const t = (r.title || "").trim()
      if (!t) errs.push(`Dòng ${idx + 2}: Thiếu 'title'`)
      if (t && seenTitles.has(t)) errs.push(`Dòng ${idx + 2}: Trùng 'title' (${t}) trong file`)
      if (t) seenTitles.add(t)
      if (r.description && typeof r.description === 'object') {
        const cleaned: any = {}
        Object.entries(r.description).forEach(([k, v]) => {
          const key = String(k).trim()
          if (!key) return
          if (v === null || v === undefined || String(v).trim() === "") return
          cleaned[key] = v
        })
        r.description = Object.keys(cleaned).length > 0 ? cleaned : undefined
      }
    })
    setErrors(errs)
  }

  const parseFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data)
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" })
      const mapped = json.map((row) => {
        const entries = Object.entries(row)
        if (entries.length === 0) return null
        const [firstKey, firstVal] = entries[0]
        const title = String(firstVal || "").trim()
        const description: any = {}
        for (let i = 1; i < entries.length; i++) {
          const [k, v] = entries[i]
          if (String(k).trim()) description[String(k).trim()] = v
        }
        return title ? { title, description } : null
      }).filter(Boolean) as Array<{ title: string; description?: any }>
      setFileName(file.name)
      setRows(mapped)
      validateRows(mapped)
    } catch (e) {
      toast.error("Không thể đọc file. Vui lòng kiểm tra định dạng")
    }
  }

  const handleSubmit = async () => {
    try {
      await importMut.mutateAsync(rows)
      toast.success(`Đã nhập ${rows.length} nội dung`)
      setRows([])
      setErrors([])
      setFileName("")
      onOpenChange(false)
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Nhập Excel thất bại"
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) { setRows([]); setErrors([]); setFileName("") }
      onOpenChange(v)
    }}>
      <DialogContent className="max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Nhập nội dung từ Excel</DialogTitle>
          <DialogDescription>
            Cột đầu tiên là title (bắt buộc). Các cột còn lại sẽ trở thành key-value trong mô tả. File ZIP có thể upload sau.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {projectId && moduleId ? (
                <span>Đang nhập vào Dự án/Module đã chọn ở màn hình chính.</span>
              ) : (
                <span className="text-red-500">Vui lòng chọn Dự án và Module ở phía trên trước khi nhập.</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadTemplate}>Tải template</Button>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Chọn file</Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) parseFile(f)
                }}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-muted/40">
            <div className="flex items-center justify-between">
              <div className="text-sm">{fileName ? `File: ${fileName}` : "Chưa chọn file"}</div>
              <div className="text-sm text-muted-foreground">Số dòng hợp lệ: {rows.length}</div>
            </div>
            {errors.length > 0 && (
              <div className="mt-3 text-sm text-red-600 space-y-1 max-h-40 overflow-auto">
                {errors.slice(0, 50).map((e, i) => (
                  <div key={i}>• {e}</div>
                ))}
                {errors.length > 50 && (
                  <div>... và {errors.length - 50} lỗi khác</div>
                )}
              </div>
            )}
            {rows.length > 0 && (
              <div className="mt-3 text-sm">
                <div className="text-muted-foreground mb-1">Xem nhanh (tối đa 5 dòng):</div>
                <ul className="list-disc pl-5">
                  {rows.slice(0, 5).map((r, i) => (
                    <li key={i} className="break-words"><span className="font-medium">{r.title}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>{importMut.isPending ? "Đang nhập..." : "Nhập"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


