"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { RefreshCw, Archive, Code, BookOpen, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"
import { toast } from "react-toastify"
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
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useUpdateContentFile } from "@/modules/content/hooks/useUpdateContentFile"
import { ContentItem } from "@/components/content/table"

interface UpdateFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: ContentItem | null
  projectId: string
  moduleId: string
}

const contentTypes = [
  {
    id: "FILE_ZIP_HTML",
    name: "HTML Package",
    description: "File ZIP chứa HTML, CSS, JS",
    icon: Code,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "FILE_ZIP_SCORM",
    name: "SCORM Package",
    description: "File ZIP theo chuẩn SCORM",
    icon: BookOpen,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
]

export function UpdateFileDialog({ open, onOpenChange, content, projectId, moduleId }: UpdateFileDialogProps) {
  const [selectedType, setSelectedType] = useState<"FILE_ZIP_HTML" | "FILE_ZIP_SCORM" | "">("")
  const [file, setFile] = useState<File | null>(null)
  const [detectedLaunchFile, setDetectedLaunchFile] = useState<string | null>(null)
  const [htmlFilesList, setHtmlFilesList] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const updateContentFileMut = useUpdateContentFile(projectId, moduleId)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && content) {
      // Set current content type as default
      setSelectedType(content.contentType as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM")
      setFile(null)
      setDetectedLaunchFile(null)
      setIsAnalyzing(false)
    }
  }, [open, content])

  // Function to analyze ZIP file and find HTML launch file
  const analyzeZipFile = async (file: File) => {
    if (selectedType !== "FILE_ZIP_HTML") return
    
    setIsAnalyzing(true)
    setDetectedLaunchFile(null)
    setHtmlFilesList([])
    
    try {
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(file)
      
      const htmlFiles: string[] = []
      
      zip.forEach((relativePath: string, zipEntry: any) => {
        if (!zipEntry.dir && !relativePath.startsWith('__MACOSX/') && !relativePath.includes('/__MACOSX/')) {
          const fileName = relativePath.toLowerCase()
          if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
            htmlFiles.push(relativePath)
          }
        }
      })
      
      setHtmlFilesList(htmlFiles)
      
      let launchFile: string | null = null
      if (htmlFiles.length === 1) {
        launchFile = htmlFiles[0]
      }
      
      setDetectedLaunchFile(launchFile)
      
    } catch (error) {
      console.error('Error analyzing ZIP file:', error)
      setHtmlFilesList([])
      setDetectedLaunchFile(null)
    } finally {
      setIsAnalyzing(false)
    }
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
    setIsDragging(false)
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


  const handleSubmit = async () => {
    if (!content || !selectedType || !file) {
      return
    }

    try {
      await updateContentFileMut.mutateAsync({
        contentId: content.id,
        payload: {
          contentType: selectedType,
          file
        }
      })
      
      onOpenChange(false)
    } catch (error) {
      // Error handling is done by the hook
    }
  }

  const resetDialog = () => {
    setSelectedType("")
    setFile(null)
    setDetectedLaunchFile(null)
    setHtmlFilesList([])
    setIsAnalyzing(false)
  }

  if (!content) return null

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog()
      onOpenChange(open)
    }}>
      <DialogContent className="bg-card border-border max-w-xl sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-foreground text-lg">Cập nhật File</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm space-y-1">
            <span className="block font-medium text-foreground">{content.title}</span>
            <span className="flex items-center gap-1.5 text-xs">
              <Info className="h-3 w-3" />
              {content.contentUrl}
            </span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {/* Content Type (locked to current type) */}
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">Loại tài liệu</Label>
            {(() => {
              const currentType = contentTypes.find((t) => t.id === selectedType)
              if (!currentType) return null
              return (
                <Card className={`border ${currentType.borderColor} ${currentType.bgColor}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${currentType.bgColor}`}>
                        <currentType.icon className={`h-4 w-4 ${currentType.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm truncate">{currentType.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{currentType.description}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 bg-slate-100 text-slate-500">Loại hiện tại</Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}
          </div>

          {/* File Upload */}
          {selectedType && (
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">
                File ZIP mới <span className="text-red-400">*</span>
              </Label>
              
              {!file ? (
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all bg-background/30 ${
                    isDragging 
                      ? "border-primary bg-primary/10 scale-[1.02]" 
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Archive className={`mx-auto h-10 w-10 mb-2 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-sm font-medium mb-1 ${isDragging ? "text-primary" : "text-foreground"}`}>
                    {isDragging ? "Thả file vào đây" : "Chọn file ZIP mới"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Kéo thả hoặc click để chọn
                  </p>
                  <Input
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-update"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById("file-update")?.click()}
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Chọn File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-start gap-2">
                      <Archive className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => {
                          setFile(null)
                          setDetectedLaunchFile(null)
                          setHtmlFilesList([])
                        }}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {selectedType === "FILE_ZIP_HTML" && (
                    <div className={`p-2 rounded border ${htmlFilesList.length > 1 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-muted/50 border-border'}`}>
                      {isAnalyzing ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                          <p className="text-xs text-muted-foreground">Đang phân tích...</p>
                        </div>
                      ) : htmlFilesList.length > 1 ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                            <p className="text-xs font-medium text-red-600 dark:text-red-400">
                              ZIP chứa {htmlFilesList.length} file HTML. Chỉ được phép 1 file.
                            </p>
                          </div>
                          <div className="pl-4 space-y-0.5">
                            {htmlFilesList.map((f, i) => (
                              <p key={i} className="text-xs font-mono text-red-500/80 break-all">• {f}</p>
                            ))}
                          </div>
                        </div>
                      ) : detectedLaunchFile ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Code className="h-3 w-3 text-green-400" />
                            <p className="text-xs font-medium text-foreground">File HTML:</p>
                          </div>
                          <p className="text-xs font-mono text-muted-foreground pl-4 break-all">
                            {detectedLaunchFile}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3 text-yellow-400" />
                          <p className="text-xs text-muted-foreground">Không tìm thấy HTML</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Info about keeping the same path */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                File mới sẽ <strong className="text-foreground">giữ nguyên đường dẫn</strong> để các link đã chia sẻ vẫn hoạt động.
              </p>
            </div>
          </div>
        </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={updateContentFileMut.isPending}
          >
            Hủy
          </Button>
          <Button 
            type="button" 
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={updateContentFileMut.isPending || !selectedType || !file || (selectedType === "FILE_ZIP_HTML" && htmlFilesList.length !== 1)}
          >
            {updateContentFileMut.isPending ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-3 w-3" />
                Cập nhật
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
