import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName } from "@prisma/client"
import { hasAnyPermission } from "@/lib/permissions"
import { logContentAction } from "@/lib/audit"
import { rm } from "fs/promises"
import { join } from "path"

interface Params {
  params: Promise<{
    id: string
    moduleId: string
  }>
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { contentIds } = await req.json()
    const numericIds = Array.isArray(contentIds) ? contentIds.map((v: any) => Number(v)) : []
    
    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json({ message: "Content IDs are required" }, { status: 400 })
    }

    const { id: projectId, moduleId } = await params
    const pId = Number(projectId)
    const mId = Number(moduleId)

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: {
        id: pId as any
      }
    })

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    const module = await prisma.module.findFirst({
      where: {
        id: mId as any,
        projectId: pId as any
      }
    })

    if (!module) {
      return NextResponse.json({ message: "Module not found" }, { status: 404 })
    }

    // Verify all content items exist and belong to the module
    const existingContent = await prisma.contentData.findMany({
      where: {
        id: { in: numericIds as any },
        moduleId: mId as any
      },
      select: { id: true, title: true, contentUrl: true }
    })

    if (existingContent.length !== contentIds.length) {
      return NextResponse.json({ 
        message: "Some content items not found or don't belong to this module" 
      }, { status: 400 })
    }

    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canHardDelete = isAdmin || await hasAnyPermission([PermissionName.MANAGE_ALL_CONTENT, PermissionName.HARD_DELETE_CONTENT], session.user.id)
    const canSoftDelete = await hasAnyPermission([PermissionName.SOFT_DELETE_CONTENT, PermissionName.MANAGE_OWN_CONTENT], session.user.id)

    // Permission check: must have delete permission
    if (!canHardDelete && !canSoftDelete) {
      return NextResponse.json({ message: "Forbidden: No delete permission" }, { status: 403 })
    }

    // Non-admin permission check: all items must be owned by user or shared with canDelete
    if (!canHardDelete) {
      const unauthorized = await prisma.contentData.findMany({
        where: {
          id: { in: numericIds as any },
          moduleId: mId as any,
          NOT: [
            { ownerId: Number(session.user.id) as any },
            { shares: { some: { sharedWithId: Number(session.user.id) as any, canDelete: true } } }
          ]
        },
        select: { id: true }
      })
      if (unauthorized.length > 0) {
        return NextResponse.json({ message: "Forbidden: Not owner or shared" }, { status: 403 })
      }
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      if (canHardDelete) {
        // Admin: hard delete DB records
        const deleteResult = await tx.contentData.deleteMany({
          where: {
            id: { in: numericIds as any },
            moduleId: mId as any
          }
        })

        // Remove physical files + version archives
        for (const item of existingContent) {
          try {
            if (item.contentUrl) {
              const contentDir = join(process.cwd(), 'public', item.contentUrl)
              await rm(contentDir, { recursive: true, force: true })
              const versionsDir = join(contentDir, '..', `_versions_${item.id}`)
              await rm(versionsDir, { recursive: true, force: true })
            }
          } catch { /* ignore file errors */ }
        }

        return deleteResult
      } else {
        // Non-admin: soft delete only
        const updateResult = await tx.contentData.updateMany({
          where: {
            id: { in: numericIds as any },
            moduleId: mId as any
          },
          data: { 
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        })
        return { count: updateResult.count }
      }
    })
    
    // Log audit for each deleted content
    const action = canHardDelete ? 'bulk_hard_deleted' : 'bulk_soft_deleted'
    for (const content of existingContent) {
      await logContentAction(
        session.user.id,
        action,
        String(content.id),
        {
          contentTitle: content.title,
          action: 'bulk_delete',
          count: result.count
        }
      )
    }

    return NextResponse.json({
      message: `Successfully ${isAdmin ? 'deleted' : 'soft-deleted'} ${result.count} content items`,
      deletedCount: result.count
    })

  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
