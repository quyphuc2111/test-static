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

export const sessionOptions: SessionOptions = {
  cookieName: process.env.SESSION_COOKIE_NAME || "bkt_session",
  password: process.env.SESSION_PASSWORD || "dev-secret-change-me-dev-secret-change-me",
  cookieOptions: {
    secure: false, // Set to false for development
    sameSite: "lax",
    httpOnly: true,
    path: "/",
  },
}

export async function getSession() {
  return getIronSession<AppSession>(await cookies(), sessionOptions)
}


