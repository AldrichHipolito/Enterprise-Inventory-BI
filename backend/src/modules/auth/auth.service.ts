// src/modules/auth/auth.service.ts
//
// All business logic lives here, never in the controller. Per
// 17-coding-standards.md, any multi-table write in one logical event uses
// prisma.$transaction(...) — this method writes to `login_history` and,
// on success, `sessions` and a `users` counter reset, so it's wrapped.
//
// PATTERN TO REUSE: services never touch req/res — they take plain inputs,
// return plain data or throw an AppError subclass, and controllers translate
// that into HTTP. This keeps services testable without mocking Express.

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { PrismaClient } from "@prisma/client";
import { env } from "../../config/env";
import { UnauthorizedError, NotFoundError } from "../../lib/errors";
import type { AccessTokenPayload } from "../../middleware/authenticate";
import type { LoginInput, ChangePasswordInput } from "./auth.dto";

const prisma = new PrismaClient();

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    mustChangePassword: boolean;
  };
}

function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.jwt.accessTokenExpiry,
  });
}

function signRefreshToken(userId: number): string {
  // Refresh tokens only need to prove "this is a valid session for this
  // user" — authorization claims (roles/warehouses) belong on the access
  // token, which gets re-issued fresh on every /auth/refresh call anyway.
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.jwt.refreshTokenExpiry,
  });
}

export async function login(input: LoginInput, ipAddress: string | null): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      roles: { include: { role: true } },
      warehouses: true,
    },
  });

  // Generic message whether the email doesn't exist or the account is
  // inactive/soft-deleted — never reveal which case it was (18-security-design.md
  // doesn't spell this out explicitly, but it's standard practice alongside
  // the lockout mechanism the doc does specify).
  const invalidCredentials = () => new UnauthorizedError("Invalid email or password");

  if (!user || !user.isActive || user.deletedAt) {
    throw invalidCredentials();
  }

  // FR-1.5: lock out after 5 consecutive failed attempts, for 15 minutes.
  // Using updatedAt as the "last attempt" marker keeps this check to a single
  // column read — no separate lockout-timestamp column needed.
  const isLockedOut =
    user.failedLoginCount >= env.auth.maxFailedLoginAttempts &&
    Date.now() - user.updatedAt.getTime() < env.auth.lockoutDurationMs;

  if (isLockedOut) {
    await prisma.loginHistory.create({
      data: { userId: user.id, success: false, ipAddress },
    });
    throw new UnauthorizedError(
      "Account temporarily locked due to repeated failed attempts. Try again in 15 minutes."
    );
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 } },
      }),
      prisma.loginHistory.create({
        data: { userId: user.id, success: false, ipAddress },
      }),
    ]);
    throw invalidCredentials();
  }

  const roleNames = user.roles.map((userRole) => userRole.role.name);
  const warehouseIds = user.warehouses.map((userWarehouse) => userWarehouse.warehouseId);

  const accessTokenPayload: AccessTokenPayload = {
    sub: user.id,
    roles: roleNames,
    warehouseIds,
    mustChangePassword: user.mustChangePassword,
  };

  const accessToken = signAccessToken(accessTokenPayload);
  const refreshToken = signRefreshToken(user.id);
  const refreshTokenHash = await bcrypt.hash(refreshToken, env.bcryptCost);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0 },
    }),
    prisma.loginHistory.create({
      data: { userId: user.id, success: true, ipAddress },
    }),
    prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + env.jwt.refreshTokenExpiryMs),
      },
    }),
  ]);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

export async function changePassword(userId: number, input: ChangePasswordInput): Promise<void> {
  const newPasswordHash = await bcrypt.hash(input.newPassword, env.bcryptCost);
  await prisma.$transaction([
    prisma.user.update({
      where: {id : userId},
      data: {
        passwordHash : newPasswordHash,
        mustChangePassword : false
      },
    }),
    prisma.session.updateMany({
      where: { userId, revokedAt : null },
      data : { revokedAt : new Date() }
    })
  ]);
}