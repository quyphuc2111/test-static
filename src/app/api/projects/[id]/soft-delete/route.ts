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
      PermissionName.SOFT_DELETE_PROJECTS,
      session.user.id
    )
    if (!hasAccess) {
      return NextResponse.json({ message: "Bạn không có quyền xóa dự án" }, { status: 403 })
    }

    const projectId = Number(params.id)

    // Check if project exists and not already deleted
    const project = await prisma.project.findUnique({
      where: { id: projectId as any },
    })

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    if (project.isDeleted) {
      return NextResponse.json(
        { message: "Project is already deleted" },
        { status: 400 }
      )
    }

    // Soft delete the project with cascade to modules and content
    const updatedProject = await prisma.$transaction(async (tx) => {
      // Soft delete the project
      const project = await tx.project.update({
        where: { id: projectId as any },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
          status: 'ARCHIVED', // Set status to ARCHIVED when soft deleted
        },
      })

      // Soft delete all modules in this project
      await tx.module.updateMany({
        where: { 
          projectId: projectId as any,
          isDeleted: false 
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
          status: 'INACTIVE', // Set status to INACTIVE when soft deleted
        },
      })

      // Soft delete all content in this project
      await tx.contentData.updateMany({
        where: { 
          projectId: projectId as any,
          isDeleted: false 
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return project
    })

    // Log audit action
    await logProjectAction(session.user.id, 'soft_deleted', projectId as any, {
      projectName: updatedProject.name,
      modulesCount: await prisma.module.count({ where: { projectId: projectId as any, isDeleted: true } }),
      contentCount: await prisma.contentData.count({ where: { projectId: projectId as any, isDeleted: true } })
    })

    return NextResponse.json({
      message: "Project soft deleted successfully",
      data: updatedProject,
    })
  } catch (error) {
    console.error("Error soft deleting project:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
