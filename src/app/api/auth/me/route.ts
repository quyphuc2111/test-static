import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { getOrCreateCsrfToken } from "@/lib/csrf"
import { UserStatus } from "@prisma/client"

export async function GET() {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: Number(session.user.id) as any },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        },
        permissions: { include: { permission: true } }
      }
    })

    if (!dbUser) {
      session.destroy()
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Nếu tài khoản bị vô hiệu hoá → huỷ session, trả 401
    if (dbUser.status === UserStatus.DISABLED) {
      session.destroy()
      return NextResponse.json(
        { message: "ACCOUNT_DISABLED", reason: "Tài khoản của bạn đã bị vô hiệu hoá" },
        { status: 401 }
      )
    }

    const roles = dbUser.roles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description ?? undefined,
    }))

    const rolePermissionObjects = dbUser.roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission))
    const directPermissionObjects = dbUser.permissions.map(up => up.permission)
    const permissionMap = new Map<string, { id: string; name: any; description?: string }>()
    for (const p of [...rolePermissionObjects, ...directPermissionObjects]) {
      if (!permissionMap.has(p.id.toString())) {
        permissionMap.set(p.id.toString(), { id: p.id.toString(), name: p.name, description: p.description ?? undefined })
      }
    }

    const permissions = Array.from(permissionMap.values())

    const me = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name ?? undefined,
      status: dbUser.status,
      roles,
      permissions,
    }
    
    return NextResponse.json({ user: me })
  } catch (e) {
    console.error("/api/auth/me error:", e)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}


