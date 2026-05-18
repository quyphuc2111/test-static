import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { logModuleAction } from "@/lib/audit"

type Params = { params: Promise<{ id: string; moduleId: string }> }

export async function DELETE(
  req: NextRequest,
  context: Params
) {
  try {
    const params = await context.params
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    const hasAccess = await checkPermission(
      PermissionName.HARD_DELETE_MODULES,
      session.user.id
    )
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { moduleId } = params
    const mId = Number(moduleId)

    // Check if module exists
    const module = await prisma.module.findUnique({
      where: { id: mId as any },
      include: {
        contentData: true,
      },
    })

    if (!module) {
      return NextResponse.json({ message: "Module not found" }, { status: 404 })
    }

    // Hard delete the module (cascade will delete content)
    await prisma.module.delete({
      where: { id: mId as any },
    })
    
    // Log audit
    await logModuleAction(
      session.user.id,
      'hard_deleted',
      String(mId),
      {
        moduleName: module.name,
        description: module.description,
        deletedContentCount: module.contentData.length
      }
    )

    return NextResponse.json({
      message: "Module permanently deleted successfully",
    })
  } catch (error) {
    console.error("Error hard deleting module:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
