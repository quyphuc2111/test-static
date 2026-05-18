"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, FileText, Settings, Info } from "lucide-react"
import { useUpdateContent } from "@/modules/content/hooks/useUpdateContent"
import { useUserPermissions } from "@/modules/rbac/hooks"
import { ContentItem } from "../table/columns"

interface EditContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: ContentItem | null
  projectId: string
  moduleId: string
}

interface DescriptionItem {
  id: string
  key: string
  value: string
}

export function EditContentDialog({ 
  open, 
  onOpenChange, 
  content,
  projectId,
  moduleId
}: EditContentDialogProps) {
  const [title, setTitle] = useState("")
  const [launchFile, setLaunchFile] = useState("")
  const [descriptionItems, setDescriptionItems] = useState<DescriptionItem[]>([])
  
  const updateContentMut = useUpdateContent(projectId, moduleId)
  const { isAdmin, hasPermission, hasAnyPermission } = useUserPermissions()

  // Determine if user can edit advanced fields
  const canEditAdvanced = isAdmin || hasAnyPermission?.([
    'MANAGE_ALL_CONTENT' as any
  ]) || false

  // Initialize form when content changes
  useEffect(() => {
    if (content && open) {
      setTitle(content.title || "")
      
      // Parse description
      const desc = content.description
      if (desc && typeof desc === 'object' && !Array.isArray(desc)) {
        // Extract launchFile if admin
        if (desc.launchFile) {
          setLaunchFile(String(desc.launchFile))
        }
        
        // Skip scorm and launchFile fields from description items
        const items = Object.entries(desc)
          .filter(([key]) => key !== 'scorm' && key !== 'launchFile')
          .map(([key, value], index) => ({
            id: `desc-${index}`,
            key,
            value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
          }))
        setDescriptionItems(items.length > 0 ? items : [{ id: 'desc-0', key: '', value: '' }])
      } else {
        setDescriptionItems([{ id: 'desc-0', key: '', value: '' }])
      }
    }
  }, [content, open])

  const resetForm = () => {
    setTitle("")
    setLaunchFile("")
    setDescriptionItems([{ id: 'desc-0', key: '', value: '' }])
  }

  const addDescriptionItem = () => {
    const newId = `desc-${Date.now()}`
    setDescriptionItems([...descriptionItems, { id: newId, key: '', value: '' }])
  }

  const removeDescriptionItem = (id: string) => {
    if (descriptionItems.length > 1) {
      setDescriptionItems(descriptionItems.filter(item => item.id !== id))
    }
  }

  const updateDescriptionItem = (id: string, field: 'key' | 'value', value: string) => {
    setDescriptionItems(descriptionItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content) return
    if (!title.trim()) {
      return
    }

    // Build description object
    const descriptionObj: any = {}
    
    // Preserve scorm (always read-only)
    const originalDesc = content.description
    if (originalDesc && typeof originalDesc === 'object') {
      if (originalDesc.scorm) descriptionObj.scorm = originalDesc.scorm
      
      // launchFile: admin can edit, others preserve original
      if (canEditAdvanced && launchFile.trim()) {
        descriptionObj.launchFile = launchFile.trim()
      } else if (originalDesc.launchFile) {
        descriptionObj.launchFile = originalDesc.launchFile
      }
    }
    
    // Add user-defined fields
    descriptionItems.forEach(item => {
      if (item.key.trim()) {
        try {
          // Try to parse as JSON if it looks like JSON
          descriptionObj[item.key] = item.value.trim().startsWith('{') || item.value.trim().startsWith('[')
            ? JSON.parse(item.value)
            : item.value
        } catch {
          descriptionObj[item.key] = item.value
        }
      }
    })

    updateContentMut.mutate({
      contentId: content.id,
      payload: {
        title: title.trim(),
        description: descriptionObj
      }
    }, {
      onSuccess: () => {
        onOpenChange(false)
        resetForm()
      }
    })
  }

  if (!content) return null

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent 
        className="bg-card border-border w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[70vw] max-w-none h-[90vh] sm:h-[85vh] md:h-[80vh] lg:h-[75vh] xl:h-[70vh] 2xl:h-[65vh]"
        style={{
          width: '60vw',
          maxWidth: '60vw',
          height: '80vh',
          maxHeight: '80vh'
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl text-foreground">Chỉnh sửa Nội dung</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground truncate">
            Cập nhật thông tin cho tài liệu: {content.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-2 sm:pr-4 min-h-0">
            <div className="space-y-4 sm:space-y-6 pb-4">
              {/* Content Info Card */}
              <Card className="border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Thông tin cơ bản
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {content.contentType === 'FILE_ZIP_SCORM' ? 'SCORM' : 'HTML'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Tên nội dung *
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Nhập tên nội dung"
                      className="bg-background"
                      required
                    />
                  </div>

                  {/* Launch File (Admin Only) - For both SCORM and HTML */}
                  {canEditAdvanced && (
                    <div className="space-y-2">
                      <Label htmlFor="launchFile" className="text-sm font-medium flex items-center gap-1">
                        <Settings className="h-3.5 w-3.5 text-amber-500" />
                        Launch File
                        <Badge variant="secondary" className="text-[10px] ml-2">Admin Only</Badge>
                      </Label>
                      <Input
                        id="launchFile"
                        value={launchFile}
                        onChange={(e) => setLaunchFile(e.target.value)}
                        placeholder={content.contentType === 'FILE_ZIP_SCORM' ? "index.html" : "index.html"}
                        className="bg-background font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        File entry point cho {content.contentType === 'FILE_ZIP_SCORM' ? 'SCORM' : 'HTML'} content
                        (ví dụ: index.html, story.html, main.html)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Separator />

              {/* Description Card */}
              <Card className="border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Mô tả & Metadata</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDescriptionItem}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm trường
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {descriptionItems.map((item, index) => (
                      <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start p-3 rounded-lg border border-muted/50 hover:border-muted transition-colors">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-3 w-full">
                          <div className="sm:col-span-2">
                            <Input
                              value={item.key}
                              onChange={(e) => updateDescriptionItem(item.id, 'key', e.target.value)}
                              placeholder="Key (vd: author, version)"
                              className="bg-background text-xs sm:text-sm"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <Textarea
                              value={item.value}
                              onChange={(e) => updateDescriptionItem(item.id, 'value', e.target.value)}
                              placeholder="Giá trị..."
                              className="bg-background text-xs sm:text-sm min-h-[36px] sm:min-h-[38px] resize-none"
                              rows={1}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDescriptionItem(item.id)}
                          disabled={descriptionItems.length === 1}
                          className="shrink-0 self-end sm:self-auto"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ))}
                    {descriptionItems.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Chưa có metadata. Click "Thêm trường" để thêm.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <Separator className="flex-shrink-0" />
          
          <DialogFooter className="mt-4 gap-2 flex-shrink-0 flex-col sm:flex-row">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-0">
              <p className="text-xs text-muted-foreground">
                {content.isShared && (
                  <span className="flex items-center gap-1 flex-wrap">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 text-xs">
                      Tài liệu được chia sẻ
                    </Badge>
                    {content.sharePermissions && !content.sharePermissions.canEdit && (
                      <span className="text-amber-400 text-xs">• Chỉ được xem</span>
                    )}
                  </span>
                )}
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateContentMut.isPending}
                  className="flex-1 sm:flex-none"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={updateContentMut.isPending || !title.trim()}
                  className="flex-1 sm:flex-none min-w-[120px]"
                >
                  {updateContentMut.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

