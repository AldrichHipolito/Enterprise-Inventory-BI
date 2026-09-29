// lib/auth.ts
import { jwtDecode } from "jwt-decode"
import { apiClient } from "./api-client"


export interface AccessTokenPayload {
  sub: number
  roles: string[]
  warehouseIds: number[]
  mustChangePassword: boolean
  exp: number // standard JWT claim, added automatically by jsonwebtoken.sign()
}

export function getCurrentUser(): AccessTokenPayload | null {
  const token = localStorage.getItem("accessToken")
  if (!token) return null

  try {
    return jwtDecode<AccessTokenPayload>(token)
  } catch {
    return null // malformed/corrupted token in storage
  }
}

export function logout(refreshToken: string) {
  const accessToken = localStorage.getItem("accessToken")
  return apiClient<{ message: string }>("/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ refreshToken }),
  })
}