import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to manage roles
    if (!(await hasPermission("MANAGE_USER_PERMISSIONS"))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { id: roleId } = await params
    const numericRoleId = Number(roleId)

    // Get source role with permissions
    const sourceRole = await prisma.role.findUnique({
      where: { id: numericRoleId as any },
      include: {
        permissions: true
      }
    })

    if (!sourceRole) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 })
    }

    // Create cloned role
    const clonedRole = await prisma.$transaction(async (tx) => {
      // Find a unique name for the cloned role
      let clonedName = `${sourceRole.name} (Copy)`
      let counter = 1
      while (await tx.role.findUnique({ where: { name: clonedName } })) {
        clonedName = `${sourceRole.name} (Copy ${counter})`
        counter++
      }

      // Create new role
      const newRole = await tx.role.create({
        data: {
          name: clonedName,
          description: sourceRole.description,
          isActive: sourceRole.isActive
        }
      })

      // Copy permissions
      if (sourceRole.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: sourceRole.permissions.map((rp) => ({
            roleId: newRole.id,
            permissionId: rp.permissionId
          }))
        })
      }

      return newRole
    })
    
    // Log audit
    await createAuditLog({
      actorId: session.user.id,
      action: 'cloned',
      entityType: 'Role',
      entityId: String(clonedRole.id),
      metadata: {
        roleName: clonedRole.name,
        sourceRoleId: roleId,
        sourceRoleName: sourceRole.name,
        permissionCount: sourceRole.permissions.length
      }
    })

    return NextResponse.json({ data: clonedRole }, { status: 201 })
  } catch (error) {
    console.error("Error cloning role:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

