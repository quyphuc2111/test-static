import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"

function getAllowedOriginFromEnv(): string | null {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || ""
  try {
    return envUrl ? new URL(envUrl).origin : null
  } catch {
    return null
  }
}

export async function getOrCreateCsrfToken(): Promise<string> {
  const session = await getSession()
  if (!session.csrfToken) {
    // crypto.randomUUID is available in Node 18+
    session.csrfToken = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
    await session.save()
  }
  return session.csrfToken
}

export async function verifyCsrfAndOrigin(req: NextRequest): Promise<{ error: string; status: number } | null> {
  const session = await getSession()
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 }
  }

  // Origin/Referer check for state-changing requests
  const method = req.method.toUpperCase()
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = req.headers.get("origin") || undefined
    const referer = req.headers.get("referer") || undefined
    const allowedOrigin = getAllowedOriginFromEnv()

    if (allowedOrigin) {
      const ref = origin || referer
      try {
        if (!ref || new URL(ref).origin !== allowedOrigin) {
          return { error: "Forbidden", status: 403 }
        }
      } catch {
        return { error: "Forbidden", status: 403 }
      }
    }

    // CSRF token verification removed
  }

  return null
}

/**
 * Verify CSRF token only (without origin check)
 */
export async function verifyCsrfToken(token: string): Promise<boolean> {
  const session = await getSession()
  return !!(session.csrfToken && token && token === session.csrfToken)
}


