import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { createAuditLog } from "@/lib/audit"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
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

    const { shareId } = await params
    const numericShareId = Number(shareId)
    const body = await req.json()
    const { canView, canEdit, canDelete, canDownload } = body

    if (typeof canView !== 'boolean' || typeof canEdit !== 'boolean' || typeof canDelete !== 'boolean' || typeof canDownload !== 'boolean') {
      return NextResponse.json({ message: "Invalid permission values" }, { status: 400 })
    }

    // Check if user can modify this share
    const isAdmin = Array.isArray(session.user?.roles) && (session.user!.roles as any[]).includes("ADMINISTRATOR")
    const canManageAll = await hasPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)

    const share = await prisma.contentShare.findFirst({
      where: {
        id: numericShareId as any,
        status: 'ACTIVE',
        ...(isAdmin || canManageAll ? {} : { sharedById: Number(session.user.id) as any })
      }
    })

    if (!share) {
      return NextResponse.json({ message: "Share not found or you don't have permission to modify it" }, { status: 404 })
    }

    // Update share permissions
    const updatedShare = await prisma.contentShare.update({
      where: { id: numericShareId as any },
        data: {
          canView,
          canEdit,
          canDelete,
          canDownload,
          updatedAt: new Date()
        },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            contentType: true,
            status: true,
            project: {
              select: {
                id: true,
                name: true
              }
            },
            module: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        sharedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sharedWith: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    // Log audit
    await createAuditLog({
      actorId: session.user.id,
      action: 'permissions_updated',
      entityType: 'ContentShare',
      entityId: shareId,
      metadata: {
        contentId: updatedShare.contentId,
        contentTitle: updatedShare.content?.title,
        sharedWithId: updatedShare.sharedWithId,
        sharedWithEmail: updatedShare.sharedWith?.email,
        permissions: { canView, canEdit, canDelete, canDownload }
      }
    })

    return NextResponse.json({ data: updatedShare })

  } catch (error) {
    console.error("Error updating content share:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
