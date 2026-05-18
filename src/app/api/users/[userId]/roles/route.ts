import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { logUserAction } from "@/lib/audit"

interface Params {
  params: Promise<{
    userId: string
  }>
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view user roles
    if (!(await hasPermission("VIEW_USERS"))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const numericUserId = Number(userId)

    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: numericUserId as any
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ data: userRoles })
  } catch (error) {
    console.error("Error fetching user roles:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to manage user roles
    if (!(await hasPermission("MANAGE_USER_PERMISSIONS"))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const numericUserId = Number(userId)
    const { roleId } = await req.json()
    const numericRoleId = roleId != null ? Number(roleId) : undefined

    if (!roleId) {
      return NextResponse.json({ message: "Role ID is required" }, { status: 400 })
    }

    // Check if user already has this role
    const existingRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: numericUserId as any,
          roleId: numericRoleId as any
        }
      }
    })

    if (existingRole) {
      return NextResponse.json({ message: "User already has this role" }, { status: 400 })
    }

    const userRole = await prisma.userRole.create({
      data: {
        userId: numericUserId as any,
        roleId: numericRoleId as any
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })
    
    // Get user info for audit
    const user = await prisma.user.findUnique({
      where: { id: numericUserId as any },
      select: { name: true }
    })
    
    // Log audit
    await logUserAction(
      session.user.id,
      'role_assigned',
      userId,
      {
        userName: user?.name,
        roleId: roleId,
        roleName: userRole.role?.name
      }
    )

    return NextResponse.json({ data: userRole }, { status: 201 })
  } catch (error) {
    console.error("Error assigning role to user:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to manage user roles
    if (!(await hasPermission("MANAGE_USER_PERMISSIONS"))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const numericUserId = Number(userId)
    const { searchParams } = new URL(req.url)
    const roleId = searchParams.get('roleId')
    const numericRoleId = roleId != null ? Number(roleId) : undefined

    if (!roleId) {
      return NextResponse.json({ message: "Role ID is required" }, { status: 400 })
    }
    
    // Get user info for audit
    const user = await prisma.user.findUnique({
      where: { id: numericUserId as any },
      select: { name: true }
    })

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId: numericUserId as any,
          roleId: numericRoleId as any
        }
      }
    })
    
    // Log audit
    await logUserAction(
      session.user.id,
      'role_removed',
      userId,
      {
        userName: user?.name,
        roleId: roleId
      }
    )

    return NextResponse.json({ message: "Role removed successfully" })
  } catch (error) {
    console.error("Error removing role from user:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
