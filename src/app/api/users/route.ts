import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { PermissionName, UserStatus } from "@prisma/client"
import { logUserAction } from "@/lib/audit"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view users
    if (!(await hasPermission(PermissionName.VIEW_USERS, session.user.id))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const pageParam = Number(searchParams.get('page') || '1')
    const pageSizeParam = Number(searchParams.get('pageSize') || '10')
    const search = (searchParams.get('search') || '').trim()

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
    const pageSizeRaw = Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? pageSizeParam : 20
    const pageSize = Math.min(pageSizeRaw, 100)
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const total = await prisma.user.count({ where })

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
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
        }
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      skip,
      take: pageSize,
    })

    return NextResponse.json({ 
      data: users,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
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

    if (!(await hasPermission(PermissionName.CREATE_USERS, session.user.id))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { username, name, email, status, roleId, password } = body

    if (!username) {
      return NextResponse.json({ message: "Username is required" }, { status: 400 })
    }

    const generateTempPassword = (): string => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*" // no ambiguous chars
      const length = 12
      let result = ""
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const created = await prisma.$transaction(async (tx) => {
      const plainPassword = (password && String(password).trim().length >= 8) ? String(password).trim() : generateTempPassword()
      const passwordHash = await bcrypt.hash(plainPassword, 10)
      const newUser = await tx.user.create({
        data: {
          username,
          email: email ?? null,
          name: name ?? null,
          status: status ?? UserStatus.ACTIVE,
          passwordHash,
        },
      })

      if (roleId) {
        await tx.userRole.create({ data: { userId: newUser.id, roleId } })
      }

      const fullUser = await tx.user.findUnique({
        where: { id: newUser.id },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
        },
      })

      return { user: fullUser!, temporaryPassword: plainPassword }
    })
    
    // Log audit
    await logUserAction(
      session.user.id,
      'created',
      String(created.user.id),
      {
        userName: created.user.name,
        email: created.user.email,
        username: created.user.username,
        roleId: roleId
      }
    )

    return NextResponse.json({ data: created.user, temporaryPassword: created.temporaryPassword }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)
    let message = "Internal server error"
    if (error?.code === "P2002") {
      const target = error?.meta?.target?.[0]
      message = target === "username" ? "Username already exists" : "Email already exists"
    }
    return NextResponse.json({ message }, { status: 500 })
  }
}
