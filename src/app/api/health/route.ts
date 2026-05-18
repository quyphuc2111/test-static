import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Health check endpoint cho Docker HEALTHCHECK và load balancer.
 * - Trả về 200 nếu app + database đang hoạt động.
 * - Trả về 503 nếu database không kết nối được.
 *
 * Endpoint này được public (không cần auth) — middleware đã cho qua via PUBLIC paths.
 */
export async function GET() {
  const startedAt = Date.now()
  try {
    // Lightweight DB ping — không tốn resource
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json(
      {
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        db: "connected",
        latencyMs: Date.now() - startedAt,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        db: "disconnected",
        error: message,
      },
      { status: 503 }
    )
  }
}
