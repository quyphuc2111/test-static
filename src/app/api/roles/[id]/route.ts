import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

export async function PATCH(
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

    const { name, description, permissionIds, isActive } = await req.json()
    const { id: roleId } = await params
    const numericRoleId = Number(roleId)

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 })
    }

    const role = await prisma.$transaction(async (tx) => {
      // Update role
      const updatedRole = await tx.role.update({
        where: { id: numericRoleId as any },
        data: {
          name,
          description,
          ...(isActive !== undefined && { isActive })
        }
      })

      // Update permissions if provided
      if (permissionIds && Array.isArray(permissionIds)) {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: numericRoleId as any }
        })

        // Add new permissions
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId: string) => ({
              roleId: numericRoleId as any,
              permissionId: Number(permissionId) as any
            }))
          })
        }
      }

      return updatedRole
    })
    
    // Log audit
    await createAuditLog({
      actorId: session.user.id,
      action: 'updated',
      entityType: 'Role',
      entityId: roleId,
      metadata: {
        roleName: role.name,
        changes: { name, description, permissionIds, isActive }
      }
    })

    return NextResponse.json({ data: role })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    
    // Get role info before deleting
    const role = await prisma.role.findUnique({
      where: { id: numericRoleId as any },
      select: { name: true, description: true }
    })

    // Check if role is being used by any users
    const usersWithRole = await prisma.userRole.findFirst({
      where: { roleId: numericRoleId as any }
    })

    if (usersWithRole) {
      return NextResponse.json(
        { message: "Cannot delete role that is assigned to users" },
        { status: 400 }
      )
    }

    // Delete role and its permissions
    await prisma.$transaction(async (tx) => {
      // Delete role permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: numericRoleId as any }
      })

      // Delete role
      await tx.role.delete({
        where: { id: numericRoleId as any }
      })
    })
    
    // Log audit
    if (role) {
      await createAuditLog({
        actorId: session.user.id,
        action: 'deleted',
        entityType: 'Role',
        entityId: roleId,
        metadata: {
          roleName: role.name,
          description: role.description
        }
      })
    }

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

