"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Upload, Archive, Code, BookOpen, CheckCircle, AlertCircle } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useContent } from "@/modules/content/hooks/useContent"
import { useUpdateContent } from "@/modules/content/hooks/useUpdateContent"
import { toast } from "react-toastify"
import { ContentItem } from "@/components/content/table"

interface UploadMissingFilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

type ContentWithFile = {
  content: ContentItem
  file: File | null
  contentType: "FILE_ZIP_HTML" | "FILE_ZIP_SCORM" | ""
  isUploading: boolean
  uploadProgress: number
}

export function UploadMissingFilesDialog({ open, onOpenChange, projectId, moduleId }: UploadMissingFilesDialogProps) {
  const [contentWithFiles, setContentWithFiles] = useState<ContentWithFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [detectedLaunchFiles, setDetectedLaunchFiles] = useState<Record<string, string | null>>({})
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({})
  const [draggingContentId, setDraggingContentId] = useState<string | null>(null)

  const contentQuery = useContent(projectId, moduleId, !!projectId && !!moduleId)
  const updateContentMut = useUpdateContent(projectId, moduleId)

  // Filter content that doesn't have files (contentUrl is empty or null)
  const contentWithoutFiles = contentQuery.data?.filter(content => 
    !content.contentUrl || content.contentUrl.trim() === ""
  ) || []

  // Initialize content with files when dialog opens
  useEffect(() => {
    if (open && contentWithoutFiles.length > 0) {
      const initialContent = contentWithoutFiles.map(content => ({
        content,
        file: null,
        contentType: "" as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM" | "",
        isUploading: false,
        uploadProgress: 0
      }))
      setContentWithFiles(initialContent)
    }
  }, [open, contentWithoutFiles])

  // Function to analyze ZIP file and find HTML launch file
  const analyzeZipFile = async (file: File, contentId: string) => {
    setIsAnalyzing(prev => ({ ...prev, [contentId]: true }))
    setDetectedLaunchFiles(prev => ({ ...prev, [contentId]: null }))
    
    try {
      // Create a temporary URL for the file
      const fileUrl = URL.createObjectURL(file)
      
      // Use JSZip to read the ZIP file
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(file)
      
      // Find HTML files
      const htmlFiles: string[] = []
      const indexFiles: string[] = []
      
      zip.forEach((relativePath: string, zipEntry: any) => {
        if (!zipEntry.dir) {
          const fileName = relativePath.toLowerCase()
          if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
            htmlFiles.push(relativePath)
            
            // Check for index files
            const baseName = fileName.split('/').pop() || ''
            if (baseName === 'index.html' || baseName === 'index.htm') {
              indexFiles.push(relativePath)
            }
          }
        }
      })
      
      // Determine launch file priority
      let launchFile: string | null = null
      
      if (indexFiles.length > 0) {
        // Prefer index.html or index.htm
        launchFile = indexFiles[0]
      } else if (htmlFiles.length > 0) {
        // Use first HTML file found
        launchFile = htmlFiles[0]
      }
      
      setDetectedLaunchFiles(prev => ({ ...prev, [contentId]: launchFile }))
      
      // Clean up
      URL.revokeObjectURL(fileUrl)
      
    } catch (error) {
      console.error('Error analyzing ZIP file:', error)
      setDetectedLaunchFiles(prev => ({ ...prev, [contentId]: null }))
    } finally {
      setIsAnalyzing(prev => ({ ...prev, [contentId]: false }))
    }
  }

  const handleFileChange = (contentId: string, file: File | null) => {
    setContentWithFiles(prev => prev.map(item => 
      item.content.id === contentId 
        ? { ...item, file }
        : item
    ))

    if (file) {
      // Analyze file if it's HTML type
      const contentType = contentWithFiles.find(item => item.content.id === contentId)?.contentType
      if (contentType === "FILE_ZIP_HTML") {
        analyzeZipFile(file, contentId)
      }
    } else {
      setDetectedLaunchFiles(prev => ({ ...prev, [contentId]: null }))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, contentId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingContentId(contentId)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingContentId(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, contentId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingContentId(null)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.name.endsWith('.zip')) {
      handleFileChange(contentId, droppedFile)
    } else {
      toast.error("Vui lòng chọn file ZIP")
    }
  }

  const handleContentTypeChange = (contentId: string, contentType: "FILE_ZIP_HTML" | "FILE_ZIP_SCORM") => {
    setContentWithFiles(prev => prev.map(item => 
      item.content.id === contentId 
        ? { ...item, contentType }
        : item
    ))

    // Re-analyze file if it's HTML type
    const item = contentWithFiles.find(item => item.content.id === contentId)
    if (item?.file && contentType === "FILE_ZIP_HTML") {
      analyzeZipFile(item.file, contentId)
    } else {
      setDetectedLaunchFiles(prev => ({ ...prev, [contentId]: null }))
    }
  }

  const handleSubmit = async () => {
    const itemsToUpload = contentWithFiles.filter(item => 
      item.file && item.contentType
    )

    if (itemsToUpload.length === 0) {
      toast.error("Vui lòng chọn ít nhất một file để upload")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload files one by one
      for (const item of itemsToUpload) {
        setContentWithFiles(prev => prev.map(c => 
          c.content.id === item.content.id 
            ? { ...c, isUploading: true, uploadProgress: 0 }
            : c
        ))

        try {
          // Create form data for file upload
          const formData = new FormData()
          formData.append("file", item.file!)
          formData.append("contentType", item.contentType)

          // Update content with file
          await updateContentMut.mutateAsync({
            contentId: item.content.id,
            payload: {
              title: item.content.title,
              description: item.content.description
            }
          })

          setContentWithFiles(prev => prev.map(c => 
            c.content.id === item.content.id 
              ? { ...c, isUploading: false, uploadProgress: 100 }
              : c
          ))

        } catch (error) {
          console.error(`Failed to upload file for content ${item.content.title}:`, error)
          setContentWithFiles(prev => prev.map(c => 
            c.content.id === item.content.id 
              ? { ...c, isUploading: false, uploadProgress: 0 }
              : c
          ))
        }
      }

      toast.success(`Đã upload thành công ${itemsToUpload.length} file(s)`)
      onOpenChange(false)
      
      // Reset state
      setContentWithFiles([])
      setDetectedLaunchFiles({})
      setIsAnalyzing({})

    } catch (error) {
      console.error('Upload failed:', error)
      toast.error("Có lỗi xảy ra khi upload file")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetDialog = () => {
    setContentWithFiles([])
    setDetectedLaunchFiles({})
    setIsAnalyzing({})
    setIsSubmitting(false)
  }

  const readyToUpload = contentWithFiles.filter(item => 
    item.file && item.contentType
  ).length

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog()
      onOpenChange(open)
    }}>
      <DialogContent 
        className="bg-card border-border overflow-hidden flex flex-col"
        style={{ 
          width: '80vw', 
          maxWidth: '80vw', 
          height: '90vh',
          maxHeight: '90vh'
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-foreground">Upload File cho Tài liệu Thiếu</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload file ZIP cho các tài liệu chưa có file. Tìm thấy {contentWithoutFiles.length} tài liệu cần upload file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-4 pr-2">
              {contentWithFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-400" />
                  <p className="text-lg font-medium">Tất cả tài liệu đã có file</p>
                  <p className="text-sm">Không có tài liệu nào cần upload file</p>
                </div>
              ) : (
                contentWithFiles.map((item) => (
                  <Card key={item.content.id} className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Content Info */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground text-lg">{item.content.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              ID: {item.content.id}
                            </p>
                            {item.content.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {typeof item.content.description === 'string' 
                                  ? item.content.description 
                                  : JSON.stringify(item.content.description)
                                }
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {item.isUploading && (
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                Đang upload...
                              </Badge>
                            )}
                            {item.file && item.contentType && !item.isUploading && (
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                Sẵn sàng
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Content Type Selection */}
                        <div className="space-y-3">
                          <Label className="text-foreground font-medium">Chọn loại tài liệu</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {contentTypes.map((type) => (
                              <Card
                                key={type.id}
                                className={`cursor-pointer transition-all duration-200 border-2 ${
                                  item.contentType === type.id 
                                    ? `${type.borderColor} ${type.bgColor} shadow-md` 
                                    : "border-border hover:border-primary/50 hover:shadow-sm"
                                }`}
                                onClick={() => handleContentTypeChange(item.content.id, type.id as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM")}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${type.bgColor}`}>
                                      <type.icon className={`h-4 w-4 ${type.color}`} />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-foreground text-sm">{type.name}</h4>
                                      <p className="text-xs text-muted-foreground">{type.description}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* File Upload */}
                        {item.contentType && (
                          <div className="space-y-3">
                            <Label className="text-foreground font-medium">
                              Upload File ZIP <span className="text-red-400">*</span>
                            </Label>
                            <div 
                              className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 bg-background/30 backdrop-blur-sm ${
                                draggingContentId === item.content.id 
                                  ? "border-primary bg-primary/10 scale-[1.02]" 
                                  : "border-border hover:border-primary/50 hover:bg-primary/5"
                              }`}
                              onDragOver={(e) => handleDragOver(e, item.content.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, item.content.id)}
                            >
                              <Archive className={`mx-auto h-8 w-8 mb-2 transition-colors ${draggingContentId === item.content.id ? "text-primary" : "text-muted-foreground"}`} />
                              <div className="space-y-2">
                                <div>
                                  <p className={`font-medium text-sm ${draggingContentId === item.content.id ? "text-primary" : "text-foreground"}`}>
                                    {draggingContentId === item.content.id ? "Thả file vào đây" : "Kéo thả file ZIP vào đây"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Hoặc click để chọn file từ máy tính
                                  </p>
                                </div>
                                <Input
                                  type="file"
                                  accept=".zip"
                                  onChange={(e) => handleFileChange(item.content.id, e.target.files?.[0] || null)}
                                  className="hidden"
                                  id={`file-${item.content.id}`}
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => document.getElementById(`file-${item.content.id}`)?.click()}
                                  className="bg-muted/50 border-border hover:bg-muted"
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Chọn File ZIP
                                </Button>
                              </div>
                              {item.file && (
                                <div className="mt-3 space-y-2">
                                  <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                                    <div className="flex items-center gap-2">
                                      <Archive className="h-4 w-4 text-blue-400" />
                                      <div className="flex-1 text-left">
                                        <p className="text-sm font-medium text-foreground">{item.file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {item.contentType === "FILE_ZIP_HTML" && (
                                    <div className="p-2 bg-muted/50 rounded-lg border border-border">
                                      {isAnalyzing[item.content.id] ? (
                                        <div className="flex items-center gap-2">
                                          <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                                          <p className="text-xs text-muted-foreground">Đang phân tích file ZIP...</p>
                                        </div>
                                      ) : detectedLaunchFiles[item.content.id] ? (
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <Code className="h-3 w-3 text-green-400" />
                                            <p className="text-xs font-medium text-foreground">File HTML chính:</p>
                                          </div>
                                          <div className="bg-background/50 rounded p-1 border border-border">
                                            <p className="text-xs font-mono text-foreground break-all">
                                              {detectedLaunchFiles[item.content.id]}
                                            </p>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <AlertCircle className="h-3 w-3 text-yellow-400" />
                                          <p className="text-xs text-muted-foreground">
                                            Không tìm thấy file HTML trong ZIP
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-3 pt-4 flex-shrink-0">
            <div className="flex-1 text-sm text-muted-foreground">
              {readyToUpload > 0 && (
                <span>{readyToUpload} tài liệu sẵn sàng upload</span>
              )}
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button 
              type="button" 
              className="bg-primary hover:bg-primary/90"
              onClick={handleSubmit}
              disabled={isSubmitting || readyToUpload === 0}
            >
              {isSubmitting ? "Đang upload..." : `Upload ${readyToUpload} File(s)`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
