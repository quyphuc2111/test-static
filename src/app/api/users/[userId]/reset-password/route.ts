import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { logUserAction } from "@/lib/audit"
import bcrypt from "bcryptjs"

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
    const body = await req.json().catch(() => ({}))
    const { newPassword } = body as { newPassword?: string }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ message: "Mật khẩu phải có ít nhất 8 ký tự" }, { status: 400 })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    const updated = await prisma.user.update({
      where: { id: numericUserId as any },
      data: { passwordHash },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    
    // Log audit
    await logUserAction(
      session.user.id,
      'password_reset',
      userId,
      {
        userName: updated.name,
        resetBy: session.user.id
      }
    )

    return NextResponse.json({ 
      data: updated,
      message: "Đặt lại mật khẩu thành công" 
    })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}





