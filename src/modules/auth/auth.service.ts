import httpService from "@/services/instance"
import { AUTH_API_URL } from "@/constants/apiUrl"
import { LoginPayload, LoginResponse } from "./auth.interface"
import storageService from "@/services/storageService"

export async function login(payload: LoginPayload) {
  const res = await httpService.post<LoginResponse>({ url: AUTH_API_URL.LOGIN, data: payload })
  if (res?.user?.token) {
    storageService.set("access_token", res.user.token)
  }
  return res.user
}

export async function logout() {
  try {
    await httpService.post({ url: AUTH_API_URL.LOGOUT })
  } finally {
    storageService.remove("access_token")
    storageService.remove("refresh_token")
  }
}

export async function getMe() {
  const res = await httpService.get<LoginResponse>({
    url: AUTH_API_URL.ME,
  })
  if ((res as any)?.csrfToken) {
    storageService.set("csrf_token", (res as any).csrfToken)
  }
  return res?.user ?? null
}

export async function getMeOptional() {
  try {
    const res = await httpService.get<LoginResponse>({
      url: AUTH_API_URL.ME,
      headers: { "X-Optional-Auth": "true" },
    })
    if ((res as any)?.csrfToken) {
      storageService.set("csrf_token", (res as any).csrfToken)
    }
    return res?.user ?? null
  } catch {
    return null
  }
}


