import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { logProjectAction } from "@/lib/audit"

type Params = { params: Promise<{ id: string }> }

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
      PermissionName.RESTORE_PROJECTS,
      session.user.id
    )
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const projectId = Number(params.id)

    // Check if project exists and is deleted
    const project = await prisma.project.findUnique({
      where: { id: projectId as any },
    })

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    if (!project.isDeleted) {
      return NextResponse.json(
        { message: "Project is not deleted" },
        { status: 400 }
      )
    }

    // Restore the project with cascade to modules and content
    const restoredProject = await prisma.$transaction(async (tx) => {
      // Restore the project
      const project = await tx.project.update({
        where: { id: projectId as any },
        data: {
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date(),
          status: 'ACTIVE', // Restore to ACTIVE status when restored
        },
      })

      // Restore all modules in this project
      await tx.module.updateMany({
        where: { 
          projectId: projectId as any,
          isDeleted: true 
        },
        data: {
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date(),
          status: 'ACTIVE', // Restore to ACTIVE status when restored
        },
      })

      // Restore all content in this project
      await tx.contentData.updateMany({
        where: { 
          projectId: projectId as any,
          isDeleted: true 
        },
        data: {
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date(),
        },
      })

      return project
    })

    // Log audit action
    await logProjectAction(session.user.id, 'restored', projectId as any, {
      projectName: restoredProject.name,
      modulesCount: await prisma.module.count({ where: { projectId: projectId as any, isDeleted: false } }),
      contentCount: await prisma.contentData.count({ where: { projectId: projectId as any, isDeleted: false } })
    })

    return NextResponse.json({
      message: "Project restored successfully",
      data: restoredProject,
    })
  } catch (error) {
    console.error("Error restoring project:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
