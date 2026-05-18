import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = await prisma.permission.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ data: permissions })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
