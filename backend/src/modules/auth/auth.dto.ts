// src/modules/auth/auth.dto.ts
//
// Validates request payloads before they reach the service layer.
// Per 17-coding-standards.md: "DTOs implement those rules, they don't invent
// new ones" — this mirrors 22-validation-rules.md exactly (email required +
// valid format, password required + min 8 chars), same rules your frontend's
// lib/validations/auth.ts already enforces client-side.
//
// PATTERN TO REUSE: every other module's *.dto.ts follows this exact shape —
// one z.object() per endpoint, one exported TypeScript type inferred from it.

import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from your current password",
  path: ["newPassword"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;