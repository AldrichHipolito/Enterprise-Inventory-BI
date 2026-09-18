// lib/auth.ts
import { jwtDecode } from "jwt-decode"

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