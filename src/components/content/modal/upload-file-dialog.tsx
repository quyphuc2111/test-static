"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Upload, Archive, Code, BookOpen, CheckCircle, AlertCircle } from "lucide-react"
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
import { useUploadContentFile } from "@/modules/content/hooks/useUploadContentFile"
import { ContentItem } from "@/components/content/table"

interface UploadFileDialogProps {
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

export function UploadFileDialog({ open, onOpenChange, content, projectId, moduleId }: UploadFileDialogProps) {
  const [selectedType, setSelectedType] = useState<"FILE_ZIP_HTML" | "FILE_ZIP_SCORM" | "">("")
  const [file, setFile] = useState<File | null>(null)
  const [detectedLaunchFile, setDetectedLaunchFile] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const uploadContentFileMut = useUploadContentFile(projectId, moduleId)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedType("")
      setFile(null)
      setDetectedLaunchFile(null)
      setIsAnalyzing(false)
    }
  }, [open])

  // Function to analyze ZIP file and find HTML launch file
  const analyzeZipFile = async (file: File) => {
    if (selectedType !== "FILE_ZIP_HTML") return
    
    setIsAnalyzing(true)
    setDetectedLaunchFile(null)
    
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
      
      setDetectedLaunchFile(launchFile)
      
      // Clean up
      URL.revokeObjectURL(fileUrl)
      
    } catch (error) {
      console.error('Error analyzing ZIP file:', error)
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

  const handleContentTypeChange = (contentType: "FILE_ZIP_HTML" | "FILE_ZIP_SCORM") => {
    setSelectedType(contentType)
    
    // Re-analyze file if it's HTML type
    if (file && contentType === "FILE_ZIP_HTML") {
      analyzeZipFile(file)
    } else {
      setDetectedLaunchFile(null)
    }
  }

  const handleSubmit = async () => {
    if (!content || !selectedType || !file) {
      return
    }

    try {
      await uploadContentFileMut.mutateAsync({
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
    setIsAnalyzing(false)
  }

  if (!content) return null

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog()
      onOpenChange(open)
    }}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Upload File cho Tài liệu</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload file ZIP cho tài liệu: <strong>{content.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Type Selection */}
          <div className="space-y-4">
            <Label className="text-foreground font-medium">Chọn loại tài liệu</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contentTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all duration-200 border-2 ${
                    selectedType === type.id 
                      ? `${type.borderColor} ${type.bgColor} shadow-md` 
                      : "border-border hover:border-primary/50 hover:shadow-sm"
                  }`}
                  onClick={() => handleContentTypeChange(type.id as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${type.bgColor}`}>
                        <type.icon className={`h-6 w-6 ${type.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{type.name}</h3>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* File Upload */}
          {selectedType && (
            <div className="space-y-4">
              <Label className="text-foreground font-medium">
                Upload File ZIP <span className="text-red-400">*</span>
              </Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 bg-background/30 backdrop-blur-sm ${
                  isDragging 
                    ? "border-primary bg-primary/10 scale-[1.02]" 
                    : "border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Archive className={`mx-auto h-8 w-8 mb-2 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                <div className="space-y-2">
                  <div>
                    <p className={`font-medium text-sm ${isDragging ? "text-primary" : "text-foreground"}`}>
                      {isDragging ? "Thả file vào đây" : "Kéo thả file ZIP vào đây"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Hoặc click để chọn file từ máy tính
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    className="bg-muted/50 border-border hover:bg-muted"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Chọn File ZIP
                  </Button>
                </div>
                {file && (
                  <div className="mt-3 space-y-2">
                    <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4 text-blue-400" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedType === "FILE_ZIP_HTML" && (
                      <div className="p-2 bg-muted/50 rounded-lg border border-border">
                        {isAnalyzing ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                            <p className="text-xs text-muted-foreground">Đang phân tích file ZIP...</p>
                          </div>
                        ) : detectedLaunchFile ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Code className="h-3 w-3 text-green-400" />
                              <p className="text-xs font-medium text-foreground">File HTML chính:</p>
                            </div>
                            <div className="bg-background/50 rounded p-1 border border-border">
                              <p className="text-xs font-mono text-foreground break-all">
                                {detectedLaunchFile}
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

        <DialogFooter className="gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={uploadContentFileMut.isPending}
          >
            Hủy
          </Button>
          <Button 
            type="button" 
            className="bg-primary hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={uploadContentFileMut.isPending || !selectedType || !file}
          >
            {uploadContentFileMut.isPending ? "Đang upload..." : "Upload File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
