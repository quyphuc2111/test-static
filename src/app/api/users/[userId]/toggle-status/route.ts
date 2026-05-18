import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { PermissionName, UserStatus } from "@prisma/client"
import { logUserAction } from "@/lib/audit"
import { userEventBus } from "@/lib/user-events"

type Params = { params: Promise<{ userId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!(await hasPermission(PermissionName.EDIT_USERS, session.user.id))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const numericUserId = Number(userId)

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: numericUserId as any },
      select: { status: true }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Toggle status
    const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE

    const updated = await prisma.user.update({
      where: { id: numericUserId as any },
      data: { status: newStatus },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    })
    
    // Log audit
    await logUserAction(
      session.user.id,
      'status_toggled',
      userId,
      {
        userName: updated.name,
        newStatus: updated.status
      }
    )

    // Emit SSE event để force logout user bị disable
    if (newStatus === UserStatus.DISABLED) {
      userEventBus.emitUserDisabled(numericUserId)
    } else {
      userEventBus.emitUserEnabled(numericUserId)
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("Error toggling user status:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}





