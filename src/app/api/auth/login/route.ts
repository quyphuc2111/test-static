import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"
import { UserStatus } from "@prisma/client"
import { createAuditLog } from "@/lib/audit"

export async function POST(req: Request) {
  try {
    const { login, password } = await req.json()
    if (!login || !password) {
      return NextResponse.json({ message: "Thiếu tên đăng nhập/email hoặc mật khẩu" }, { status: 400 })
    }

    // Try to find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: login },
          { email: login }
        ]
      },
      include: {
        roles: { include: { role: true } },
        permissions: { include: { permission: true } },
      },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ message: "Sai thông tin đăng nhập" }, { status: 401 })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return NextResponse.json({ message: "Sai thông tin đăng nhập" }, { status: 401 })
    }

    if (user.status === UserStatus.DISABLED) {
      return NextResponse.json({ message: "Tài khoản đã bị vô hiệu hoá" }, { status: 403 })
    }

    const roles = user.roles.map((ur) => ur.role.name)
    const permissions = user.permissions.map((up) => up.permission.name)

    const session = await getSession()
    session.user = {
      id: user.id as any,
      username: user.username,
      email: user.email,
      name: user.name,
      status: user.status,
      roles,
      permissions,
    }
    await session.save()
    
    // Log audit for login
    await createAuditLog({
      actorId: String(user.id),
      action: 'login',
      entityType: 'User',
      entityId: String(user.id),
      metadata: {
        userName: user.name,
        email: user.email,
        username: user.username,
        loginMethod: login.includes('@') ? 'email' : 'username'
      }
    })

    return NextResponse.json({ user: session.user })
  } catch (error) {
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 })
  }
}


