import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { PermissionName, ShareStatus } from "@prisma/client"
import { createAuditLog } from "@/lib/audit"

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check SHARE_CONTENT_ACCESS permission
    const canShare = await hasPermission(PermissionName.SHARE_CONTENT_ACCESS, session.user.id)
    if (!canShare) {
      return NextResponse.json({ message: "Forbidden: Missing SHARE_CONTENT_ACCESS permission" }, { status: 403 })
    }

    const body = await req.json()
    const { shareId, batchId } = body

    if (!shareId && !batchId) {
      return NextResponse.json({ message: "Share ID or Batch ID is required" }, { status: 400 })
    }

    const isAdmin = Array.isArray(session.user?.roles) && (session.user!.roles as any[]).includes("ADMINISTRATOR")
    const canManageAll = await hasPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)

    if (batchId) {
      // Revoke entire batch
      const batch = await prisma.shareBatch.findFirst({
        where: {
          id: Number(batchId) as any,
          ...(isAdmin || canManageAll ? {} : { sharedById: Number(session.user.id) as any })
        }
      })

      if (!batch) {
        return NextResponse.json({ message: "Batch not found or you don't have permission to revoke it" }, { status: 404 })
      }

      // Update batch status
      await prisma.shareBatch.update({
        where: { id: Number(batchId) as any },
        data: {
          status: ShareStatus.REVOKED,
          revokedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Update all shares in the batch
      const revokedShares = await prisma.contentShare.updateMany({
        where: { batchId: Number(batchId) as any },
        data: {
          status: ShareStatus.REVOKED,
          canView: false,
          canEdit: false,
          canDelete: false,
          canDownload: false,
          revokedAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      // Log audit for batch revoke
      await createAuditLog({
        actorId: session.user.id,
        action: 'batch_revoked',
        entityType: 'ShareBatch',
        entityId: String(batchId),
        metadata: {
          scope: batch.scope,
          sharedWithId: batch.sharedWithId,
          itemsCount: batch.itemsCount,
          revokedCount: revokedShares.count
        }
      })

      return NextResponse.json({ message: "Batch sharing revoked successfully" })
    }

    if (shareId) {
      // Revoke individual share
      const share = await prisma.contentShare.findFirst({
        where: {
          id: Number(shareId) as any,
          ...(isAdmin || canManageAll ? {} : { 
            OR: [
              { sharedById: Number(session.user.id) as any },
              { sharedWithId: Number(session.user.id) as any }
            ]
          })
        }
      })

      if (!share) {
        return NextResponse.json({ message: "Share not found or you don't have permission to revoke it" }, { status: 404 })
      }

      // Update share status
      const revokedShare = await prisma.contentShare.update({
        where: { id: Number(shareId) as any },
        data: {
          status: ShareStatus.REVOKED,
          canView: false,
          canEdit: false,
          canDelete: false,
          canDownload: false,
          revokedAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          content: {
            select: { id: true, title: true }
          },
          sharedWith: {
            select: { id: true, email: true }
          }
        }
      })
      
      // Log audit for individual revoke
      await createAuditLog({
        actorId: session.user.id,
        action: 'revoked',
        entityType: 'ContentShare',
        entityId: String(shareId),
        metadata: {
          contentId: revokedShare.contentId,
          contentTitle: revokedShare.content?.title,
          sharedWithId: revokedShare.sharedWithId,
          sharedWithEmail: revokedShare.sharedWith?.email
        }
      })

      return NextResponse.json({ message: "Content sharing revoked successfully" })
    }

  } catch (error) {
    console.error("Error revoking content share:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}