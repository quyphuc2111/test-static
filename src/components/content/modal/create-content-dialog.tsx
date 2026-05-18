"use client"

import type React from "react"
import { useState, useRef } from "react"
import { UploadCloud, Archive, Code, BookOpen, Plus, Trash2, File as FileIcon, X, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateContent } from "@/modules/content/hooks/useCreateContent"
import { CreateContentPayload } from "@/modules/content/content.interface"
import { toast } from "react-toastify"

interface CreateContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  moduleId: string
}

type DescriptionItem = {
  id: string
  key: string
  value: string
}

const MAX_VISIBLE_FILE_NAME_LENGTH = 48

const getDisplayFileName = (fileName: string) => {
  if (fileName.length <= MAX_VISIBLE_FILE_NAME_LENGTH) return fileName

  const extensionMatch = fileName.match(/\.[^./\\]+$/)
  const extension = extensionMatch?.[0] ?? ''
  const nameWithoutExtension = extension ? fileName.slice(0, -extension.length) : fileName
  const headLength = 28
  const tailLength = Math.max(10, MAX_VISIBLE_FILE_NAME_LENGTH - headLength - extension.length - 3)

  return `${nameWithoutExtension.slice(0, headLength)}...${nameWithoutExtension.slice(-tailLength)}${extension}`
}

export function CreateContentDialog({ open, onOpenChange, projectId, moduleId }: CreateContentDialogProps) {
  const [selectedType, setSelectedType] = useState<"FILE_ZIP_HTML" | "FILE_ZIP_SCORM" | "">("FILE_ZIP_HTML")
  const [title, setTitle] = useState("")
  const [descriptionItems, setDescriptionItems] = useState<DescriptionItem[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [detectedLaunchFile, setDetectedLaunchFile] = useState<string | null>(null)
  const [htmlFilesList, setHtmlFilesList] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createContentMut = useCreateContent(projectId, moduleId)

  const analyzeZipFile = async (zipFile: File) => {
    if (selectedType !== "FILE_ZIP_HTML") return

    setIsAnalyzing(true)
    setDetectedLaunchFile(null)
    setHtmlFilesList([])

    try {
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(zipFile)

      const htmlFiles: string[] = []
      const indexFiles: string[] = []
      const subdirIndexFiles: string[] = []

      zip.forEach((relativePath: string, zipEntry: any) => {
        if (!zipEntry.dir && !relativePath.startsWith('__MACOSX/') && !relativePath.includes('/__MACOSX/')) {
          const fileName = relativePath.toLowerCase()
          if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
            htmlFiles.push(relativePath)
            const baseName = fileName.split('/').pop() || ''
            if (baseName === 'index.html' || baseName === 'index.htm') {
              const pathParts = relativePath.split('/')
              if (pathParts.length > 1) {
                subdirIndexFiles.push(relativePath)
              } else {
                indexFiles.push(relativePath)
              }
            }
          }
        }
      })

      setHtmlFilesList(htmlFiles)

      let launchFile: string | null = null
      if (htmlFiles.length === 1) {
        launchFile = htmlFiles[0]
      } else if (htmlFiles.length > 1) {
        // >1 HTML files — don't set launchFile, error will show
        launchFile = null
      }

      setDetectedLaunchFile(launchFile)
    } catch (error) {
      console.error('Error analyzing ZIP file:', error)
      setDetectedLaunchFile(null)
      setHtmlFilesList([])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType || !title || !file) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    const descriptionJson = descriptionItems.reduce((acc, item) => {
      if (item.key.trim() && item.value.trim()) {
        acc[item.key.trim()] = item.value.trim()
      }
      return acc
    }, {} as Record<string, string>)

    const payload: CreateContentPayload = {
      title: title.trim(),
      description: Object.keys(descriptionJson).length > 0 ? JSON.stringify(descriptionJson) : undefined,
      contentType: selectedType,
      file,
    }

    // Fire and forget — close modal immediately, upload runs in background
    createContentMut.mutate(payload)
    toast.info("Đang tải lên nội dung, vui lòng chờ...")
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setSelectedType("FILE_ZIP_HTML")
    setTitle("")
    setDescriptionItems([])
    setFile(null)
    setDetectedLaunchFile(null)
    setIsAnalyzing(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile && selectedType === "FILE_ZIP_HTML") {
      analyzeZipFile(selectedFile)
    } else {
      setDetectedLaunchFile(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.name.endsWith('.zip')) {
      setFile(droppedFile)
      if (selectedType === "FILE_ZIP_HTML") {
        analyzeZipFile(droppedFile)
      }
    } else {
      toast.error("Vui lòng chọn file ZIP")
    }
  }

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setDetectedLaunchFile(null)
    setHtmlFilesList([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addDescriptionItem = () => {
    setDescriptionItems([...descriptionItems, { id: Date.now().toString(), key: "", value: "" }])
  }

  const removeDescriptionItem = (id: string) => {
    setDescriptionItems(descriptionItems.filter(item => item.id !== id))
  }

  const updateDescriptionItem = (id: string, field: 'key' | 'value', value: string) => {
    setDescriptionItems(descriptionItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Tạo Nội dung mới</DialogTitle>
          <DialogDescription>
            Upload file ZIP (HTML hoặc SCORM) để tạo nội dung học tập
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Content Type */}
          <div className="space-y-2">
            <Label>Loại nội dung <span className="text-red-500">*</span></Label>
            <Select
              value={selectedType}
              onValueChange={(v) => {
                setSelectedType(v as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM")
                if (file && v === "FILE_ZIP_HTML") analyzeZipFile(file)
                else setDetectedLaunchFile(null)
              }}
            >
              <SelectTrigger className="w-full bg-white dark:bg-slate-900">
                <SelectValue placeholder="Chọn loại nội dung" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="FILE_ZIP_HTML">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-blue-500" />
                    HTML Package (.zip)
                  </div>
                </SelectItem>
                <SelectItem value="FILE_ZIP_SCORM">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-green-500" />
                    SCORM Package (.zip)
                  </div>
                </SelectItem>
              
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="create-title">Tiêu đề <span className="text-red-500">*</span></Label>
            <Input
              id="create-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề nội dung"
              className="bg-white dark:bg-slate-900"
              required
            />
          </div>

          {/* Description Key-Value */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Mô tả chi tiết</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addDescriptionItem} className="h-7 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Thêm
              </Button>
            </div>

            {descriptionItems.length === 0 ? (
              <div className="text-center py-6 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-xs">Chưa có mô tả. Click "Thêm" để bổ sung.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {descriptionItems.map((item) => (
                  <div key={item.id} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Tên (VD: Tác giả)"
                        value={item.key}
                        onChange={(e) => updateDescriptionItem(item.id, 'key', e.target.value)}
                        className="text-sm h-9 bg-white dark:bg-slate-900"
                      />
                      <Input
                        placeholder="Giá trị (VD: Admin)"
                        value={item.value}
                        onChange={(e) => updateDescriptionItem(item.id, 'value', e.target.value)}
                        className="text-sm h-9 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDescriptionItem(item.id)}
                      className="h-9 w-9 text-slate-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload File ZIP <span className="text-red-500">*</span></Label>

            {!file ? (
              <div
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer group ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                } ${!selectedType ? 'opacity-50 pointer-events-none' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => selectedType && fileInputRef.current?.click()}
              >
                <div className={`p-3 rounded-full mb-3 ${
                  isDragging
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600'
                }`}>
                  <UploadCloud className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1 text-center">
                  {!selectedType ? "Chọn loại nội dung trước" : "Click để chọn hoặc kéo thả file"}
                </p>
                <p className="text-xs text-slate-500 text-center">
                  Chỉ hỗ trợ file .zip
                </p>
                <input
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-3">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center">
                      <FileIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p
                        className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100"
                        title={file.name}
                      >
                        {getDisplayFileName(file.name)}
                      </p>
                      <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8 shrink-0 text-slate-500 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* HTML launch file detection */}
                {selectedType === "FILE_ZIP_HTML" && (
                  <div className={`p-3 rounded-lg border ${htmlFilesList.length > 1 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                        <p className="text-xs text-slate-500">Đang phân tích file ZIP...</p>
                      </div>
                    ) : htmlFilesList.length > 1 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">
                            File ZIP chứa {htmlFilesList.length} file HTML. Chỉ được phép 1 file HTML.
                          </p>
                        </div>
                        <div className="pl-6 space-y-0.5">
                          {htmlFilesList.map((f, i) => (
                            <p key={i} className="text-xs font-mono text-red-500/80 break-all">• {f}</p>
                          ))}
                        </div>
                      </div>
                    ) : detectedLaunchFile ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">File HTML chính:</p>
                        </div>
                        <p className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 break-all">
                          {detectedLaunchFile}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <p className="text-xs text-slate-500">Không tìm thấy file HTML trong ZIP</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { resetForm(); onOpenChange(false) }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-24"
              disabled={!selectedType || !title || !file || (selectedType === "FILE_ZIP_HTML" && htmlFilesList.length > 1)}
            >
              Tạo Nội dung
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
