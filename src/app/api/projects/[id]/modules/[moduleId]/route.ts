import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { logModuleAction } from "@/lib/audit"

type Params = { params: Promise<{ id: string; moduleId: string }> }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    // Check permission to edit modules
    const hasAccess = await checkPermission(PermissionName.EDIT_MODULES, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ message: "Bạn không có quyền chỉnh sửa module" }, { status: 403 })
    }

    const body = await req.json()
    const name = (body?.name ?? "").trim()
    const description = (body?.description ?? "").trim()
    const status = body?.status
    
    if (!name) return NextResponse.json({ message: "Tên module là bắt buộc" }, { status: 400 })

    try {
      const { moduleId } = await params
      const mId = Number(moduleId)
      const updateData: any = { name }
      if (description !== undefined) updateData.description = description || null
      if (status !== undefined) updateData.status = status
      
      const updated = await prisma.module.update({
        where: { id: mId as any },
        data: updateData,
        include: {
          contentData: {
            where: { isDeleted: false },
            select: { id: true }
          }
        }
      })
      
      // Transform to add _count
      const updatedWithCount = {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        isDeleted: updated.isDeleted,
        deletedAt: updated.deletedAt,
        status: updated.status,
        projectId: updated.projectId,
        _count: {
          content: updated.contentData.length
        }
      }
      
      // Log audit
      await logModuleAction(
        session.user.id,
        'updated',
        String(mId),
        {
          moduleName: updated.name,
          description: updated.description,
          status: updated.status,
          changes: updateData
        }
      )
      
      return NextResponse.json({ data: updatedWithCount })
    } catch (err: any) {
      if (err?.code === "P2002") {
        return NextResponse.json({ message: "Module đã tồn tại trong dự án" }, { status: 409 })
      }
      throw err
    }
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    // Check permission to hard delete modules
    const hasAccess = await checkPermission(PermissionName.HARD_DELETE_MODULES, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ message: "Bạn không có quyền xóa module" }, { status: 403 })
    }

    const { moduleId } = await params
    const mId = Number(moduleId)

    // Check if module has active (not soft-deleted) content
    const contentCount = await prisma.contentData.count({
      where: { 
        moduleId: mId as any,
        isDeleted: false // Only count active content
      }
    })

    if (contentCount > 0) {
      return NextResponse.json({ 
        message: `Module chứa ${contentCount} tài liệu đang hoạt động. Vui lòng xóa mềm tất cả tài liệu trước.`,
        contentCount 
      }, { status: 400 })
    }
    
    // Get module info before deleting
    const module = await prisma.module.findUnique({
      where: { id: mId as any }
    })

    await prisma.module.delete({ where: { id: mId as any } })
    
    // Log audit
    if (module) {
      await logModuleAction(
        session.user.id,
        'hard_deleted',
        String(mId),
        {
          moduleName: module.name,
          description: module.description
        }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("Error deleting module:", e)
    return NextResponse.json({ message: e?.message || "Server error" }, { status: 500 })
  }
}


