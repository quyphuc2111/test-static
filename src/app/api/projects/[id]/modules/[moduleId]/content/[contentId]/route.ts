import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { rm } from "fs/promises"
import { join } from "path"
import { PermissionName } from "@prisma/client"
import { hasAnyPermission, hasPermission as checkPermission } from "@/lib/permissions"
import { logContentAction } from "@/lib/audit"

type Params = { params: Promise<{ id: string; moduleId: string; contentId: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, moduleId, contentId } = await params
    const pId = Number(projectId)
    const mId = Number(moduleId)
    const cId = Number(contentId)
    const { title, description } = await request.json()

    // Get content to check ownership and existence
    const content = await prisma.contentData.findFirst({
      where: {
        id: cId as any,
        projectId: pId as any,
        moduleId: mId as any,
        isDeleted: false
      }
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canEditAll = await checkPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)
    const canEdit = await checkPermission(PermissionName.EDIT_CONTENT, session.user.id)
    
    // Check permissions
    if (!isAdmin && !canEditAll) {
      const isOwner = Number(content.ownerId) === Number(session.user.id)
      
      if (!isOwner) {
        // Check if shared with edit permission
        const share = await prisma.contentShare.findFirst({
          where: {
            contentId: content.id as any,
            sharedWithId: Number(session.user.id) as any,
            canEdit: true,
            status: 'ACTIVE'
          }
        })
        
        const moduleShare = await prisma.moduleShare.findFirst({
          where: {
            moduleId: content.moduleId as any,
            sharedWithId: Number(session.user.id) as any,
            permission: 'EDIT',
            status: 'ACTIVE'
          }
        })
        
        if (!share && !moduleShare) {
          return NextResponse.json({ 
            error: "Forbidden: Not owner or no edit permission" 
          }, { status: 403 })
        }
      } else {
        // Owner but needs EDIT_CONTENT or MANAGE_OWN_CONTENT permission
        const canManageOwn = await checkPermission(PermissionName.MANAGE_OWN_CONTENT, session.user.id)
        if (!canEdit && !canManageOwn) {
          return NextResponse.json({ 
            error: "Forbidden: Missing edit permission" 
          }, { status: 403 })
        }
      }
    }

    // Check if updating title and if new title already exists for this owner
    if (title && title !== content.title) {
      const existingContent = await prisma.contentData.findFirst({
        where: {
          projectId: pId as any,
          moduleId: mId as any,
          ownerId: content.ownerId as any,
          title: title as any,
          isDeleted: false,
          id: { not: cId as any }
        } as any
      })

      if (existingContent) {
        return NextResponse.json(
          { error: "Bạn đã có nội dung với tiêu đề này trong module này" },
          { status: 409 }
        )
      }
    }

    // Update content
    const updatedContent = await prisma.contentData.update({
      where: { id: cId as any },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description })
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
      'updated',
      String(cId),
      {
        contentTitle: updatedContent.title,
        changes: { title, description }
      }
    )

    return NextResponse.json({ data: updatedContent })
  } catch (error) {
    console.error("Error updating content:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, moduleId, contentId } = await params
    const pId = Number(projectId)
    const mId = Number(moduleId)
    const cId = Number(contentId)

    // Verify content exists and base constraints
    const content = await prisma.contentData.findFirst({
      where: {
        id: cId as any,
        projectId: pId as any,
        moduleId: mId as any,
        isDeleted: false
      }
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canHardDelete = await hasAnyPermission([PermissionName.MANAGE_ALL_CONTENT, PermissionName.HARD_DELETE_CONTENT], session.user.id)
    const canSoftDelete = await hasAnyPermission([PermissionName.SOFT_DELETE_CONTENT, PermissionName.MANAGE_OWN_CONTENT], session.user.id)

    // Permission check: must have delete permission
    if (!canHardDelete && !canSoftDelete) {
      return NextResponse.json({ error: "Forbidden: No delete permission" }, { status: 403 })
    }

    // Permission: owner or shared canDelete (for non-admin)
    if (!isAdmin && !canHardDelete) {
      const isOwner = Number(content.ownerId) === Number(session.user.id)
      if (!isOwner) {
        const share = await prisma.contentShare.findFirst({
          where: { contentId: content.id as any, sharedWithId: Number(session.user.id) as any, canDelete: true }
        })
        if (!share) {
          return NextResponse.json({ error: "Forbidden: Not owner or shared" }, { status: 403 })
        }
      }
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      if (canHardDelete) {
        // Hard delete: Remove from database completely
        await tx.contentData.delete({
          where: { id: cId as any }
        })

        // Also remove physical files + version archives
        try {
          const contentDir = join(process.cwd(), 'public', content.contentUrl)
          await rm(contentDir, { recursive: true, force: true })
          // Remove _versions_{contentId} sibling directory
          const versionsDir = join(contentDir, '..', `_versions_${cId}`)
          await rm(versionsDir, { recursive: true, force: true })
          console.log(`Hard deleted content directory + versions: ${contentDir}`)
        } catch (fileError) {
          console.warn(`Failed to delete content directory: ${fileError}`)
          // Don't fail the transaction if file deletion fails
        }
      } else {
        // Soft delete: Mark as deleted but keep data and files
        await tx.contentData.update({
          where: { id: cId as any },
          data: { 
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        })
      }
    })

    // Log audit action
    await logContentAction(session.user.id, canHardDelete ? 'hard_deleted' : 'soft_deleted', cId as any, {
      contentTitle: content.title,
      contentType: content.contentType,
      projectId: content.projectId,
      moduleId: content.moduleId,
      hardDelete: canHardDelete
    })

    return NextResponse.json({ 
      message: canHardDelete ? "Content permanently deleted" : "Content moved to trash"
    })

  } catch (error) {
    console.error("Error deleting content:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}