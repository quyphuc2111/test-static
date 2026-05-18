import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { PermissionName, ShareStatus } from "@prisma/client"
import { ContentStatus } from "@prisma/client"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let whereClause: any = { isDeleted: false }

    if (projectId) {
      whereClause.projectId = Number(projectId) as any
    }

    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canViewAll = isAdmin || await hasPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)

    // Get content stats
    const [total, completed, processing, failed] = await Promise.all([
      prisma.contentData.count({ where: { ...whereClause, ...(canViewAll ? {} : {
        OR: [
          { ownerId: Number(session.user.id) as any },
          { shares: { some: { sharedWithId: Number(session.user.id) as any, canView: true, status: ShareStatus.ACTIVE } } }
        ]
      }) } }),
      prisma.contentData.count({ 
        where: { ...whereClause, status: ContentStatus.COMPLETED, ...(canViewAll ? {} : {
          OR: [
            { ownerId: Number(session.user.id) as any },
            { shares: { some: { sharedWithId: Number(session.user.id) as any, canView: true, status: ShareStatus.ACTIVE } } }
          ]
        }) } 
      }),
      prisma.contentData.count({ 
        where: { ...whereClause, status: ContentStatus.PROCESSING, ...(canViewAll ? {} : {
          OR: [
            { ownerId: Number(session.user.id) as any },
            { shares: { some: { sharedWithId: Number(session.user.id) as any, canView: true, status: ShareStatus.ACTIVE } } }
          ]
        }) } 
      }),
      prisma.contentData.count({ 
        where: { ...whereClause, status: ContentStatus.FAILED, ...(canViewAll ? {} : {
          OR: [
            { ownerId: Number(session.user.id) as any },
            { shares: { some: { sharedWithId: Number(session.user.id) as any, canView: true, status: ShareStatus.ACTIVE } } }
          ]
        }) } 
      })
    ])

    const stats = {
      total,
      completed,
      processing,
      failed
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error("Error fetching content stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
