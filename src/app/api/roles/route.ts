import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view roles
    if (!(await hasPermission("VIEW_USERS"))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ data: roles })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to create roles
    if (!(await hasPermission("MANAGE_USER_PERMISSIONS"))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { name, description, permissionIds } = await req.json()

    if (!name || !permissionIds || !Array.isArray(permissionIds)) {
      return NextResponse.json({ message: "Name and permission IDs are required" }, { status: 400 })
    }

    const role = await prisma.$transaction(async (tx) => {
      // Create role
      const newRole = await tx.role.create({
        data: {
          name,
          description
        }
      })

      // Add permissions to role
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId: number) => ({
            roleId: newRole.id,
            permissionId
          }))
        })
      }

      return newRole
    })
    
    // Log audit
    await createAuditLog({
      actorId: session.user.id,
      action: 'created',
      entityType: 'Role',
      entityId: String(role.id),
      metadata: {
        roleName: role.name,
        description: role.description,
        permissions: permissionIds
      }
    })

    return NextResponse.json({ data: role }, { status: 201 })
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
