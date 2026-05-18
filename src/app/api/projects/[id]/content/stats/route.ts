import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName, ShareStatus } from "@prisma/client"
import { hasPermission as checkPermission } from "@/lib/permissions"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const pId = Number(projectId)

    // Auth and permission check
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: pId as any }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Determine visibility scope
    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canViewAll = isAdmin || await checkPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)

    // Get content statistics for this project with scope
    const stats = await prisma.contentData.groupBy({
      by: ['status'],
      where: {
        projectId: pId as any,
        isDeleted: false,
        ...(canViewAll ? {} : {
          OR: [
            { ownerId: Number(session.user.id) as any },
            { shares: { some: { sharedWithId: Number(session.user.id) as any, canView: true, status: ShareStatus.ACTIVE } } }
          ]
        })
      },
      _count: {
        id: true 
      }
    })

    // Calculate totals
    const total = stats.reduce((sum, stat) => sum + stat._count.id, 0)
    const completed = stats.find(s => s.status === 'COMPLETED')?._count.id || 0
    const processing = stats.find(s => s.status === 'PROCESSING')?._count.id || 0
    const failed = stats.find(s => s.status === 'FAILED')?._count.id || 0

    return NextResponse.json({
      data: {
        total,
        completed,
        processing,
        failed
      }
    })
  } catch (error) {
    console.error("Error fetching content stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
