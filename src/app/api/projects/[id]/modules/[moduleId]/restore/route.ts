import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { logModuleAction } from "@/lib/audit"

type Params = { params: Promise<{ id: string; moduleId: string }> }

export async function POST(
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
      PermissionName.RESTORE_MODULES,
      session.user.id
    )
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { moduleId } = params
    const mId = Number(moduleId)

    // Check if module exists and is deleted
    const module = await prisma.module.findUnique({
      where: { id: mId as any },
    })

    if (!module) {
      return NextResponse.json({ message: "Module not found" }, { status: 404 })
    }

    if (!module.isDeleted) {
      return NextResponse.json(
        { message: "Module is not deleted" },
        { status: 400 }
      )
    }

    // Restore the module with cascade to content
    const restoredModule = await prisma.$transaction(async (tx) => {
      // Restore the module
      const module = await tx.module.update({
        where: { id: mId as any },
        data: {
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date(),
          status: 'ACTIVE', // Restore to ACTIVE status when restored
        },
      })

      // Restore all content in this module
      await tx.contentData.updateMany({
        where: { 
          moduleId: mId as any,
          isDeleted: true 
        },
        data: {
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date(),
        },
      })

      return module
    })
    
    // Log audit
    await logModuleAction(
      session.user.id,
      'restored',
      String(mId),
      {
        moduleName: restoredModule.name,
        description: restoredModule.description
      }
    )

    return NextResponse.json({
      message: "Module restored successfully",
      data: restoredModule,
    })
  } catch (error) {
    console.error("Error restoring module:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
