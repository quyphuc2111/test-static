import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { logModuleAction } from "@/lib/audit"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    // Check permission to view modules
    const hasAccess = await checkPermission(PermissionName.VIEW_MODULES, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ message: "Bạn không có quyền xem danh sách module" }, { status: 403 })
    }

    const { id } = await params
    const pId = Number(id)
    const modules = await prisma.module.findMany({ 
      where: { projectId: pId as any }, 
      orderBy: { createdAt: "desc" },
      include: {
        contentData: {
          where: { isDeleted: false },
          select: { id: true }
        }
      }
    })
    
    // Transform to add _count for active content only
    const modulesWithCount = modules.map(module => ({
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
    
    return NextResponse.json({ data: modulesWithCount })
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    // Check permission to create modules
    const hasAccess = await checkPermission(PermissionName.CREATE_MODULES, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ message: "Bạn không có quyền tạo module" }, { status: 403 })
    }

    const body = await req.json()
    const name = (body?.name ?? "").trim()
    const description = (body?.description ?? "").trim()
    const status = body?.status ?? "ACTIVE"
    
    if (!name) return NextResponse.json({ message: "Tên module là bắt buộc" }, { status: 400 })

    const { id } = await params
    const pId = Number(id)
    try {
      const created = await prisma.module.create({ 
        data: { 
          name, 
          description: description || null,
          status,
          projectId: pId as any 
        },
        include: {
          contentData: {
            where: { isDeleted: false },
            select: { id: true }
          }
        }
      })
      
      // Transform to add _count
      const createdWithCount = {
        id: created.id,
        name: created.name,
        description: created.description,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        isDeleted: created.isDeleted,
        deletedAt: created.deletedAt,
        status: created.status,
        projectId: created.projectId,
        _count: {
          content: created.contentData.length
        }
      }
      
      // Log audit
      await logModuleAction(
        session.user.id,
        'created',
        String(created.id),
        {
          moduleName: created.name,
          description: created.description,
          status: created.status,
          projectId: pId
        }
      )
      
      return NextResponse.json({ data: createdWithCount }, { status: 201 })
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


