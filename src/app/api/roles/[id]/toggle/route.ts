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

    // Get current role
    const currentRole = await prisma.role.findUnique({
      where: { id: numericRoleId as any }
    })

    if (!currentRole) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 })
    }

    // Prevent disabling ADMINISTRATOR role
    if (currentRole.name === "ADMINISTRATOR") {
      return NextResponse.json({ 
        message: "Cannot disable ADMINISTRATOR role" 
      }, { status: 400 })
    }

    // Toggle status
    const updatedRole = await prisma.role.update({
      where: { id: numericRoleId as any },
      data: {
        isActive: !currentRole.isActive
      }
    })
    
    // Log audit
    await createAuditLog({
      actorId: session.user.id,
      action: 'status_toggled',
      entityType: 'Role',
      entityId: roleId,
      metadata: {
        roleName: updatedRole.name,
        newStatus: updatedRole.isActive
      }
    })

    return NextResponse.json({ data: updatedRole })
  } catch (error) {
    console.error("Error toggling role status:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

