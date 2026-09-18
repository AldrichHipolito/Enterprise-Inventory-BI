// lib/api/auth.ts
import { apiClient } from "../api-client";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    mustChangePassword: boolean;
  };
}

export function login(email: string, password: string) {
  return apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export interface ChangePasswordResponse {
  message: string;
}

export function changePassword(currentPassword: string, newPassword: string) {
  const accessToken = localStorage.getItem("accessToken")
  return apiClient<ChangePasswordResponse>("/auth/change-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
