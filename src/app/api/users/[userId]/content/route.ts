import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"

type Params = { params: Promise<{ userId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view content or is viewing their own content
    const { userId } = await params
    const numericUserId = Number(userId)
    const isOwnContent = Number(session.user.id) === numericUserId
    const hasViewPermission = await hasPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)

    if (!isOwnContent && !hasViewPermission) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Get all content owned by this user (all status except deleted)
    const content = await prisma.contentData.findMany({
      where: {
        ownerId: numericUserId as any,
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
        contentType: true,
        status: true,
        projectId: true,
        moduleId: true,
        project: {
          select: {
            id: true,
            name: true
          }
        },
        module: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: content })
  } catch (error) {
    console.error("Error fetching user content:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

