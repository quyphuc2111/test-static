import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { logProjectAction } from "@/lib/audit"
import { promises as fs } from "fs"
import path from "path"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(_req: Request, { params }: Params) {
  const { id } = await params
  const projectId = Number(id)
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    if (!(await checkPermission(PermissionName.EDIT_PROJECTS, session.user.id))) {
      return NextResponse.json({ message: "Bạn không có quyền chỉnh sửa dự án" }, { status: 403 })
    }
    const body = await _req.json()
    const name = body?.name?.trim()
    const description = body?.description?.trim()
    const status = body?.status
    
    if (!name) return NextResponse.json({ message: "Tên dự án là bắt buộc" }, { status: 400 })
    
    const updateData: any = { name }
    if (description !== undefined) updateData.description = description || null
    if (status !== undefined) updateData.status = status
    
    const updated = await prisma.project.update({ 
      where: { id: projectId as any }, 
      data: updateData,
      include: { 
        modules: {
          include: {
            contentData: {
              where: { isDeleted: false },
              select: { id: true }
            }
          }
        }
      }
    })
    
    // Transform to add _count for active content only
    const updatedWithCount = {
      ...updated,
      modules: updated.modules.map(module => ({
        id: module.id,
        name: module.name,
        description: module.description,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
        isDeleted: module.isDeleted,
        deletedAt: module.deletedAt,
        status: module.status,
        projectId: module.projectId,
        _count: {
          content: module.contentData.length
        }
      }))
    }
    
    // Log audit
    await logProjectAction(
      session.user.id,
      'updated',
      String(projectId),
      {
        projectName: updated.name,
        description: updated.description,
        status: updated.status,
        changes: updateData
      }
    )
    
    return NextResponse.json({ data: updatedWithCount })
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const projectId = Number(id)
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    if (!(await checkPermission(PermissionName.SOFT_DELETE_PROJECTS, session.user.id))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Lấy thông tin project và tất cả content trước khi xóa
    const project = await prisma.project.findUnique({
      where: { id: projectId as any },
      include: {
        contentData: true,
        modules: {
          include: {
            contentData: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    // Xóa tất cả file vật lý
    console.log(`🗑️  Starting file deletion for project: ${project.name}`)
    console.log(`📁 Project has ${project.contentData.length} direct content items`)
    console.log(`📁 Project has ${project.modules.length} modules with content`)
    
    // Xóa file từ project content
    for (const content of project.contentData) {
      if (content.contentUrl) {
        try {
          // contentUrl có format: uploads/content/... nhưng files thực tế ở public/uploads/content/...
          const filePath = path.join(process.cwd(), 'public', content.contentUrl)
          console.log(`🔍 Checking file: ${filePath}`)
          
          // Kiểm tra file có tồn tại không trước khi xóa
          try {
            await fs.access(filePath)
            await fs.unlink(filePath)
            console.log(`✅ Successfully deleted file: ${content.contentUrl}`)
          } catch (accessError) {
            console.log(`⚠️  File does not exist, skipping: ${content.contentUrl}`)
          }
        } catch (error) {
          console.warn(`❌ Failed to delete file ${content.contentUrl}:`, error)
        }
      }
    }

    // Xóa file từ module content
    for (const module of project.modules) {
      console.log(`📁 Processing module: ${module.name} with ${module.contentData.length} content items`)
      for (const content of module.contentData) {
        if (content.contentUrl) {
          try {
            // contentUrl có format: uploads/content/... nhưng files thực tế ở public/uploads/content/...
            const filePath = path.join(process.cwd(), 'public', content.contentUrl)
            console.log(`🔍 Checking file: ${filePath}`)
            
            // Kiểm tra file có tồn tại không trước khi xóa
            try {
              await fs.access(filePath)
              await fs.unlink(filePath)
              console.log(`✅ Successfully deleted file: ${content.contentUrl}`)
            } catch (accessError) {
              console.log(`⚠️  File does not exist, skipping: ${content.contentUrl}`)
            }
          } catch (error) {
            console.warn(`❌ Failed to delete file ${content.contentUrl}:`, error)
          }
        }
      }
    }

    // Xóa project (sẽ cascade xóa modules và contentData)
    await prisma.project.delete({ where: { id: projectId as any } })
    
    // Log audit
    await logProjectAction(
      session.user.id,
      'hard_deleted',
      String(projectId),
      {
        projectName: project.name,
        deletedContentCount: project.contentData.length,
        deletedModulesCount: project.modules.length
      }
    )
    
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Error deleting project:", e)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}


