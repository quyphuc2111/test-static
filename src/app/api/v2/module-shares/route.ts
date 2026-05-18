import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { createAuditLog } from "@/lib/audit"

// GET /api/v2/module-shares?moduleId=X — lấy danh sách người có quyền truy cập module
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get("moduleId")
    const projectId = searchParams.get("projectId")

    const where: any = { status: "ACTIVE" }
    if (moduleId) where.moduleId = Number(moduleId)
    if (projectId) where.projectId = Number(projectId)

    const shares = await prisma.moduleShare.findMany({
      where,
      include: {
        sharedBy: {
          select: { id: true, name: true, email: true, username: true }
        },
        sharedWith: {
          select: { id: true, name: true, email: true, username: true }
        },
        module: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ data: shares })
  } catch (error) {
    console.error("Error fetching module shares:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST /api/v2/module-shares — chia sẻ module cho user
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const canShare = await hasPermission(PermissionName.SHARE_CONTENT_ACCESS, session.user.id)
    if (!canShare) {
      return NextResponse.json({ message: "Forbidden: Missing SHARE_CONTENT_ACCESS permission" }, { status: 403 })
    }

    const body = await req.json()
    const { moduleId, projectId, sharedWithId, permission = "VIEW" } = body

    if (!moduleId || !projectId || !sharedWithId) {
      return NextResponse.json(
        { message: "moduleId, projectId, and sharedWithId are required" },
        { status: 400 }
      )
    }

    const numericModuleId = Number(moduleId)
    const numericProjectId = Number(projectId)
    const numericSharedWithId = Number(sharedWithId)

    // Kiểm tra module tồn tại
    const module = await prisma.module.findFirst({
      where: { id: numericModuleId, projectId: numericProjectId, isDeleted: false }
    })
    if (!module) {
      return NextResponse.json({ message: "Module not found" }, { status: 404 })
    }

    // Kiểm tra user tồn tại
    const user = await prisma.user.findUnique({ where: { id: numericSharedWithId } })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Không cho share cho chính mình
    if (numericSharedWithId === Number(session.user.id)) {
      return NextResponse.json({ message: "Cannot share with yourself" }, { status: 400 })
    }

    // Validate permission value
    const validPermissions = ["VIEW", "DOWNLOAD", "EDIT"]
    if (!validPermissions.includes(permission)) {
      return NextResponse.json({ message: "Invalid permission. Must be VIEW, DOWNLOAD, or EDIT" }, { status: 400 })
    }

    // Upsert: tạo mới hoặc cập nhật nếu đã tồn tại
    const share = await prisma.moduleShare.upsert({
      where: {
        moduleId_sharedWithId: {
          moduleId: numericModuleId,
          sharedWithId: numericSharedWithId
        }
      },
      update: {
        permission,
        status: "ACTIVE",
        revokedAt: null,
        updatedAt: new Date()
      },
      create: {
        moduleId: numericModuleId,
        projectId: numericProjectId,
        sharedById: Number(session.user.id),
        sharedWithId: numericSharedWithId,
        permission,
        status: "ACTIVE"
      },
      include: {
        sharedWith: {
          select: { id: true, name: true, email: true, username: true }
        },
        module: {
          select: { id: true, name: true }
        }
      }
    })

    await createAuditLog({
      actorId: session.user.id,
      action: "module_shared",
      entityType: "ModuleShare",
      entityId: String(share.id),
      metadata: {
        moduleId: numericModuleId,
        projectId: numericProjectId,
        sharedWithId: numericSharedWithId,
        permission
      }
    })

    return NextResponse.json({ data: share }, { status: 201 })
  } catch (error) {
    console.error("Error sharing module:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/v2/module-shares?id=X — thu hồi quyền truy cập module
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const canShare = await hasPermission(PermissionName.SHARE_CONTENT_ACCESS, session.user.id)
    if (!canShare) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const shareId = searchParams.get("id")

    if (!shareId) {
      return NextResponse.json({ message: "Share ID is required" }, { status: 400 })
    }

    const share = await prisma.moduleShare.findUnique({ where: { id: Number(shareId) } })
    if (!share) {
      return NextResponse.json({ message: "Share not found" }, { status: 404 })
    }

    await prisma.moduleShare.update({
      where: { id: Number(shareId) },
      data: { status: "REVOKED", revokedAt: new Date() }
    })

    await createAuditLog({
      actorId: session.user.id,
      action: "module_share_revoked",
      entityType: "ModuleShare",
      entityId: shareId,
      metadata: {
        moduleId: share.moduleId,
        sharedWithId: share.sharedWithId
      }
    })

    return NextResponse.json({ message: "Share revoked successfully" })
  } catch (error) {
    console.error("Error revoking module share:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/v2/module-shares — cập nhật quyền
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const canShare = await hasPermission(PermissionName.SHARE_CONTENT_ACCESS, session.user.id)
    if (!canShare) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { id, permission } = body

    if (!id || !permission) {
      return NextResponse.json({ message: "id and permission are required" }, { status: 400 })
    }

    const validPermissions = ["VIEW", "DOWNLOAD", "EDIT"]
    if (!validPermissions.includes(permission)) {
      return NextResponse.json({ message: "Invalid permission" }, { status: 400 })
    }

    const share = await prisma.moduleShare.update({
      where: { id: Number(id) },
      data: { permission, updatedAt: new Date() },
      include: {
        sharedWith: {
          select: { id: true, name: true, email: true, username: true }
        }
      }
    })

    await createAuditLog({
      actorId: session.user.id,
      action: "module_share_updated",
      entityType: "ModuleShare",
      entityId: String(id),
      metadata: { permission }
    })

    return NextResponse.json({ data: share })
  } catch (error) {
    console.error("Error updating module share:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
