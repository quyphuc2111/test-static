import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { logContentAction } from "@/lib/audit"

type Params = { params: Promise<{ id: string; moduleId: string; contentId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, moduleId, contentId } = await params
    const pId = Number(projectId)
    const mId = Number(moduleId)
    const cId = Number(contentId)

    // Get soft-deleted content
    const content = await prisma.contentData.findFirst({
      where: {
        id: cId as any,
        projectId: pId as any,
        moduleId: mId as any,
        isDeleted: true  // Only restore soft-deleted content
      }
    })

    if (!content) {
      return NextResponse.json({ 
        error: "Content not found or not deleted" 
      }, { status: 404 })
    }

    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canManageAll = await checkPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)
    const canRestore = await checkPermission(PermissionName.RESTORE_CONTENT, session.user.id)
    const canManageOwn = await checkPermission(PermissionName.MANAGE_OWN_CONTENT, session.user.id)
    
    // Permission check: must have RESTORE_CONTENT or be admin/manager
    if (!isAdmin && !canManageAll && !canRestore) {
      // If no restore permission, check if owner with MANAGE_OWN_CONTENT
      const isOwner = Number(content.ownerId) === Number(session.user.id)
      
      if (!isOwner || !canManageOwn) {
        return NextResponse.json({ 
          error: "Forbidden: No restore permission" 
        }, { status: 403 })
      }
    }

    // Restore content
    const restoredContent = await prisma.contentData.update({
      where: { id: cId as any },
      data: { 
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    // Log audit
    await logContentAction(
      session.user.id,
      'restored',
      String(cId),
      {
        contentTitle: restoredContent.title,
        contentType: restoredContent.contentType
      }
    )

    return NextResponse.json({ 
      data: restoredContent,
      message: "Content restored successfully"
    })
  } catch (error) {
    console.error("Error restoring content:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

