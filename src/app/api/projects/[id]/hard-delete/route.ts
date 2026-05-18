import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { logProjectAction } from "@/lib/audit"
import { promises as fs } from "fs"
import path from "path"

type Params = { params: Promise<{ id: string }> }

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

    const hasAccess = await checkPermission(
      PermissionName.HARD_DELETE_PROJECTS,
      session.user.id
    )
    if (!hasAccess) {
      return NextResponse.json({ message: "Bạn không có quyền xóa vĩnh viễn dự án" }, { status: 403 })
    }

    const projectId = Number(params.id)

    const project = await prisma.project.findUnique({
      where: { id: projectId as any },
      include: {
        modules: { include: { contentData: true } },
        contentData: true,
      },
    })

    if (!project) {
      return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 })
    }

    // Kiểm tra nếu còn module hoặc content đang active (chưa bị soft-delete)
    const activeModules = project.modules.filter(m => !m.isDeleted)
    const activeContent = project.contentData.filter(c => !c.isDeleted)
    const activeModuleContent = project.modules.flatMap(m => m.contentData.filter(c => !c.isDeleted))

    if (activeModules.length > 0 || activeContent.length > 0 || activeModuleContent.length > 0) {
      return NextResponse.json(
        {
          message: `Dự án còn ${activeModules.length} module và ${activeContent.length + activeModuleContent.length} tài liệu đang hoạt động. Hãy xóa mềm tất cả trước khi xóa vĩnh viễn.`
        },
        { status: 400 }
      )
    }

    // Xóa file vật lý trên disk
    const allContent = [...project.contentData, ...project.modules.flatMap(m => m.contentData)]
    for (const content of allContent) {
      if (content.contentUrl) {
        try {
          const contentDir = path.join(process.cwd(), "static", path.dirname(content.contentUrl))
          await fs.rm(contentDir, { recursive: true, force: true })
        } catch { /* ignore */ }
      }
      // Xóa thư mục versions
      try {
        const versionsDir = path.join(process.cwd(), "static", "uploads", "content", `_versions_${content.id}`)
        await fs.rm(versionsDir, { recursive: true, force: true })
      } catch { /* ignore */ }
    }

    await prisma.project.delete({
      where: { id: projectId as any },
    })

    await logProjectAction(session.user.id, 'hard_deleted', String(projectId), {
      projectName: project.name,
      deletedModulesCount: project.modules.length,
      deletedContentCount: allContent.length,
    })

    return NextResponse.json({
      message: "Dự án đã được xóa vĩnh viễn",
    })
  } catch (error) {
    console.error("Error hard deleting project:", error)
    return NextResponse.json(
      { message: "Lỗi server" },
      { status: 500 }
    )
  }
}
