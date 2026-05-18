import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName, ShareStatus } from "@prisma/client"
import { hasPermission as checkPermission } from "@/lib/permissions"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params
    const mId = Number(moduleId)

    // Auth and permission check
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify module exists
    const module = await prisma.module.findUnique({
      where: { id: mId as any },
      include: { project: true }
    })

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Determine visibility scope
    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canViewAll = isAdmin || await checkPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)

    // Get content count for this module with scope
    const count = await prisma.contentData.count({
      where: {
        moduleId: mId as any,
        isDeleted: false,
        ...(canViewAll ? {} : {
          OR: [
            { ownerId: Number(session.user.id) as any },
            { shares: { some: { sharedWithId: Number(session.user.id) as any, canView: true, status: ShareStatus.ACTIVE } } }
          ]
        })
      }
    })

    return NextResponse.json({
      data: { count }
    })
  } catch (error) {
    console.error("Error fetching module content count:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
