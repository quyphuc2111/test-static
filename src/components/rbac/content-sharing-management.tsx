"use client"

import { useState } from "react"
import { Plus, Share2, Eye, Edit, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useContentShares, useRemoveContentShare } from "@/modules/rbac/hooks"
import { ShareContentDialog } from "./modal/share-content-dialog"
import { PermissionGuard } from "./permission-guard"
import { PermissionName } from "@prisma/client"

export function ContentSharingManagement() {
  const [showShareDialog, setShowShareDialog] = useState(false)

  const { data: shares, isLoading } = useContentShares()
  const removeShareMut = useRemoveContentShare()

  const handleRemoveShare = (contentId: string, sharedWithId: string) => {
    if (confirm("Bạn có chắc chắn muốn gỡ quyền chia sẻ này?")) {
      removeShareMut.mutate(
        { contentId, sharedWithId },
        {
          onSuccess: () => {
            // Toast will be handled by the hook
          },
          onError: (error: any) => {
            console.error("Error removing share:", error)
          },
        }
      )
    }
  }

  const getPermissionBadges = (canView: boolean, canEdit: boolean, canDelete: boolean) => {
    const badges = []
    if (canView) badges.push({ label: "Xem", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" })
    if (canEdit) badges.push({ label: "Sửa", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" })
    if (canDelete) badges.push({ label: "Xóa", color: "bg-red-500/20 text-red-400 border-red-500/30" })
    return badges
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chia sẻ Nội dung</h2>
          <p className="text-muted-foreground">Quản lý quyền chia sẻ nội dung giữa các người dùng</p>
        </div>
        <PermissionGuard permission={PermissionName.SHARE_CONTENT_ACCESS}>
          <Button onClick={() => setShowShareDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Chia sẻ Nội dung
          </Button>
        </PermissionGuard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Chia sẻ</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shares?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Lần chia sẻ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nội dung Được Chia sẻ</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(shares?.map((share: any) => share.contentId) || []).size}
            </div>
            <p className="text-xs text-muted-foreground">Nội dung riêng biệt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Người dùng Nhận</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(shares?.map(share => share.sharedWithId) || []).size}
            </div>
            <p className="text-xs text-muted-foreground">Người dùng riêng biệt</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Chia sẻ</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải danh sách chia sẻ...
            </div>
          ) : shares && shares.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Chia sẻ bởi</TableHead>
                  <TableHead>Chia sẻ với</TableHead>
                  <TableHead>Quyền hạn</TableHead>
                  <TableHead>Ngày chia sẻ</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shares.map((share: any) => (
                  <TableRow key={share.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{share.content?.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {share.content?.contentType} • {share.content?.status}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {share.sharedBy?.name?.charAt(0) || share.sharedBy?.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{share.sharedBy?.name || "Chưa có tên"}</div>
                          <div className="text-xs text-muted-foreground">{share.sharedBy?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {share.sharedWith?.name?.charAt(0) || share.sharedWith?.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{share.sharedWith?.name || "Chưa có tên"}</div>
                          <div className="text-xs text-muted-foreground">{share.sharedWith?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getPermissionBadges(share.canView, share.canEdit, share.canDelete).map((badge, index) => (
                          <Badge key={index} className={badge.color}>
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(share.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <PermissionGuard permission={PermissionName.SHARE_CONTENT_ACCESS}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveShare(share.contentId as any, share.sharedWithId as any)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có nội dung nào được chia sẻ
            </div>
          )}
        </CardContent>
      </Card>

      <ShareContentDialog 
        open={showShareDialog} 
        onOpenChange={setShowShareDialog} 
      />
    </div>
  )
}
