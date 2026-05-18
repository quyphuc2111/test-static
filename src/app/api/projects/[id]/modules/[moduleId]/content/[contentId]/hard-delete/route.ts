import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission, hasAnyPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { logContentAction } from "@/lib/audit"
import { rm } from "fs/promises"
import { join } from "path"

type Params = { params: Promise<{ id: string; moduleId: string; contentId: string }> }

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, moduleId, contentId } = await params
    const pId = Number(projectId)
    const mId = Number(moduleId)
    const cId = Number(contentId)

    // Check if content exists
    const content = await prisma.contentData.findFirst({
      where: {
        id: cId as any,
        projectId: pId as any,
        moduleId: mId as any
      }
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Check permission for hard delete
    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canHardDelete = await hasAnyPermission([PermissionName.HARD_DELETE_CONTENT, PermissionName.MANAGE_ALL_CONTENT], session.user.id)

    if (!isAdmin && !canHardDelete) {
      return NextResponse.json({ error: "Bạn không có quyền xóa vĩnh viễn nội dung" }, { status: 403 })
    }

    // Check ownership for non-admin users
    if (!isAdmin) {
      const isOwner = Number(content.ownerId) === Number(session.user.id)
      if (!isOwner) {
        return NextResponse.json({ error: "Bạn chỉ có thể xóa vĩnh viễn nội dung của chính mình" }, { status: 403 })
      }
    }

    // Hard delete the content
    await prisma.contentData.delete({
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
      // Don't fail the request if file deletion fails
    }

    // Log audit action
    await logContentAction(session.user.id, 'hard_deleted', cId as any, {
      contentTitle: content.title,
      contentType: content.contentType,
      projectId: content.projectId,
      moduleId: content.moduleId
    })

    return NextResponse.json({
      message: "Content permanently deleted successfully"
    })

  } catch (error) {
    console.error("Error hard deleting content:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
