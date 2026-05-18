"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Info, AlertTriangle, CheckCircle } from "lucide-react"

interface SCORMInfoProps {
  scormData: {
    version: string
    title: string
    identifier: string
    organizations: number
    resources: number
    validation: {
      errors: string[]
      warnings: string[]
    }
  }
}

export function SCORMInfo({ scormData }: SCORMInfoProps) {
  const getVersionColor = (version: string) => {
    switch (version) {
      case '1.2':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case '2004':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BookOpen className="h-5 w-5 text-blue-400" />
          Thông tin SCORM
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Phiên bản</p>
            <Badge className={getVersionColor(scormData.version)}>
              SCORM {scormData.version}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ID</p>
            <p className="text-sm font-mono text-foreground">{scormData.identifier}</p>
          </div>
        </div>

        {/* Structure Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Tổ chức</p>
            <p className="text-sm font-semibold text-foreground">{scormData.organizations}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tài nguyên</p>
            <p className="text-sm font-semibold text-foreground">{scormData.resources}</p>
          </div>
        </div>

        {/* Validation Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {scormData.validation.errors.length === 0 ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
            <p className="text-sm font-medium text-foreground">
              Trạng thái xác thực
            </p>
          </div>
          
          {scormData.validation.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-red-400 font-medium">Lỗi:</p>
              {scormData.validation.errors.map((error, index) => (
                <p key={index} className="text-xs text-red-400 pl-4">
                  • {error}
                </p>
              ))}
            </div>
          )}
          
          {scormData.validation.warnings.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-yellow-400 font-medium">Cảnh báo:</p>
              {scormData.validation.warnings.map((warning, index) => (
                <p key={index} className="text-xs text-yellow-400 pl-4">
                  • {warning}
                </p>
              ))}
            </div>
          )}
          
          {scormData.validation.errors.length === 0 && scormData.validation.warnings.length === 0 && (
            <p className="text-xs text-green-400">Gói SCORM hợp lệ</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
