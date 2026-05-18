import { getIronSession, type SessionOptions } from "iron-session"
import { cookies } from "next/headers"
import { PermissionName, UserStatus } from "@prisma/client"

export type SessionUser = {
  id: string
  username: string
  email?: string | null
  name?: string | null
  status: UserStatus
  roles: string[]
  permissions: PermissionName[]
}

export type AppSession = {
  user?: SessionUser
  csrfToken?: string
}

// Cảnh báo nếu chạy production mà thiếu SESSION_PASSWORD — bắt buộc phải set
if (process.env.NODE_ENV === "production" && !process.env.SESSION_PASSWORD) {
  // eslint-disable-next-line no-console
  console.error(
    "[session] FATAL: SESSION_PASSWORD env var không được set trong production. " +
    "Hãy set một chuỗi tối thiểu 32 ký tự trong môi trường runtime (Docker/Cloudflare/etc)."
  )
}

export const sessionOptions: SessionOptions = {
  cookieName: process.env.SESSION_COOKIE_NAME || "bkt_session",
  password: process.env.SESSION_PASSWORD || "dev-secret-change-me-dev-secret-change-me",
  cookieOptions: {
    // Auto-enable secure trong production (Cloudflare/HTTPS) — tránh cookie bị leak qua HTTP
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
    path: "/",
  },
}

export async function getSession() {
  return getIronSession<AppSession>(await cookies(), sessionOptions)
}


