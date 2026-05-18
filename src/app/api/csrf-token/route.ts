import { NextResponse } from "next/server"
import { getOrCreateCsrfToken } from "@/lib/csrf"

export async function GET() {
  try {
    const csrfToken = await getOrCreateCsrfToken()
    return NextResponse.json({ csrfToken })
  } catch (error) {
    console.error("Error getting CSRF token:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
