"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileText, Settings, Database, Code, Info, BookOpen } from "lucide-react"

interface DescriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: {
    title: string
    description?: any
  } | null
}

const getFieldIcon = (key: string) => {
  const lowerKey = key.toLowerCase()
  if (lowerKey.includes('scorm')) return BookOpen
  if (lowerKey.includes('launch') || lowerKey.includes('file')) return FileText
  if (lowerKey.includes('config') || lowerKey.includes('setting')) return Settings
  if (lowerKey.includes('data') || lowerKey.includes('meta')) return Database
  return Info
}

const formatValue = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'string') {
    // Cắt ngắn đường dẫn dài
    if (value.length > 50) {
      const parts = value.split(/[/\\]/)
      if (parts.length > 2) {
        return `.../${parts.slice(-2).join('/')}`
      }
      return value.substring(0, 47) + '...'
    }
    return value
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

const isSystemField = (key: string) => {
  return ['scorm', 'launchFile'].includes(key)
}

export function DescriptionDialog({ 
  open, 
  onOpenChange, 
  content 
}: DescriptionDialogProps) {
  if (!content) return null

  const desc = content.description
  const hasDescription = desc && typeof desc === 'object' && Object.keys(desc).length > 0

  // Separate system fields and user fields
  const systemFields: [string, any][] = []
  const userFields: [string, any][] = []

  if (hasDescription) {
    Object.entries(desc).forEach(([key, value]) => {
      if (isSystemField(key)) {
        systemFields.push([key, value])
      } else {
        userFields.push([key, value])
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[70vw] max-w-none h-[90vh] sm:h-[85vh] md:h-[80vh] lg:h-[75vh] xl:h-[70vh] 2xl:h-[65vh]" style={{
        width: '60vw',
        maxWidth: '60vw',
        height: '90vh',
        maxHeight: '90vh'
      }}>
        <DialogHeader>
          <div className="flex items-center gap-2 sm:gap-3">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl truncate">Chi tiết Metadata</DialogTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{content.title}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] sm:max-h-[calc(85vh-120px)] pr-2 sm:pr-4">
          <div className="space-y-4 sm:space-y-6">
            {!hasDescription ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Không có metadata cho nội dung này
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* System Fields (SCORM, LaunchFile) */}
                {systemFields.length > 0 && (
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
                        <Settings className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span className="truncate">Cấu hình Hệ thống</span>
                        <Badge variant="secondary" className="text-xs">System Fields</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[120px] sm:w-[150px] lg:w-[200px]">Field</TableHead>
                              <TableHead>Value</TableHead>
                            </TableRow>
                          </TableHeader>
                        <TableBody>
                          {systemFields.map(([key, value]) => {
                            const Icon = getFieldIcon(key)
                            const isJson = typeof value === 'object' && value !== null
                            
                            return (
                              <TableRow key={key}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
                                    <span className="font-mono text-xs sm:text-sm truncate">{key}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="min-w-0">
                                  {isJson ? (
                                    <details className="cursor-pointer">
                                      <summary className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        Click để xem chi tiết ({Object.keys(value).length} fields)
                                      </summary>
                                      <pre className="mt-2 p-2 sm:p-3 bg-muted/50 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(value, null, 2)}
                                      </pre>
                                    </details>
                                  ) : (
                                    <TooltipProvider delayDuration={200}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="max-w-full overflow-hidden cursor-help">
                                            <span className="text-xs sm:text-sm font-mono text-foreground break-all block">
                                              {formatValue(value)}
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-[80vw] sm:max-w-[60vw] md:max-w-[50vw] lg:max-w-[40vw] bg-popover border-border z-[9999]">
                                          <p className="text-xs font-mono break-all text-foreground whitespace-pre-wrap">{String(value)}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {systemFields.length > 0 && userFields.length > 0 && <Separator />}

                {/* User-Defined Fields */}
                {userFields.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
                        <Database className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate">Metadata Tùy chỉnh</span>
                        <Badge variant="outline" className="text-xs">{userFields.length} fields</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 sm:gap-3">
                        {userFields.map(([key, value]) => {
                          const Icon = getFieldIcon(key)
                          const isJson = typeof value === 'object' && value !== null
                          const isLongText = typeof value === 'string' && value.length > 100
                          
                          return (
                            <div 
                              key={key} 
                              className="p-3 sm:p-4 rounded-lg border border-muted hover:border-primary/50 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                                <div className="flex items-center gap-2 min-w-0 sm:min-w-[120px] lg:min-w-[150px]">
                                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
                                  <span className="font-semibold text-xs sm:text-sm truncate">{key}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  {isJson ? (
                                    <details className="cursor-pointer">
                                      <summary className="text-xs sm:text-sm text-primary hover:underline">
                                        Object ({Object.keys(value).length} properties)
                                      </summary>
                                      <pre className="mt-2 p-2 sm:p-3 bg-card border rounded text-xs overflow-x-auto">
                                        {JSON.stringify(value, null, 2)}
                                      </pre>
                                    </details>
                                  ) : isLongText ? (
                                    <details className="cursor-pointer">
                                      <summary className="text-xs sm:text-sm text-primary hover:underline">
                                        Text ({value.length} characters)
                                      </summary>
                                      <div className="mt-2 p-2 sm:p-3 bg-muted/30 rounded text-xs sm:text-sm">
                                        {value}
                                      </div>
                                    </details>
                                  ) : (
                                    <TooltipProvider delayDuration={200}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-start gap-1 sm:gap-2 max-w-full overflow-hidden cursor-help">
                                            <Code className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                            <span className="text-xs sm:text-sm text-foreground break-all min-w-0 flex-1">
                                              {formatValue(value)}
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-[80vw] sm:max-w-[60vw] md:max-w-[50vw] lg:max-w-[40vw] bg-popover border-border z-[9999]">
                                          <p className="text-xs font-mono break-all text-foreground whitespace-pre-wrap">{String(value)}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

