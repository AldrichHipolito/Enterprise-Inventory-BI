// src/middleware/authenticate.ts
//
// Verifies the JWT access token on every protected route and attaches its
// claims to req.user. Per 18-security-design.md, the token itself carries
// userId, roles, and warehouseIds so authorize.ts / warehouse-scope.ts never
// need an extra DB round-trip on every request.
//
// mustChangePassword is included as a fourth claim beyond what the doc lists
// explicitly, because 18-security-design.md separately requires: "must_change_
// password, which the auth middleware checks on every request and forces a
// redirect to POST /auth/change-password before anything else is allowed."
// Enforcing that from a DB flag would mean a query on every request, which
// defeats the stated purpose of embedding claims in the token — so this
// middleware treats it as a claim, the same as roles/warehouseIds. When you
// write auth.service.ts, include `mustChangePassword: user.mustChangePassword`
// when signing the access token so this middleware sees it consistently.

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { UnauthorizedError, ForbiddenError } from "../lib/errors";

export interface AccessTokenPayload {
  /** users.id */
  sub: number;
  /** role names, e.g. ["Warehouse Staff"] — a user can hold more than one role */
  roles: string[];
  /** warehouses.id the user is scoped to (user_warehouses). Empty for roles
   *  exempt from warehouse scoping (Administrator, Executive) per FR-1.8. */
  warehouseIds: number[];
  mustChangePassword: boolean;
}

// Routes a user must still be able to reach even while must_change_password
// is true — otherwise they'd be locked out with no way to satisfy the
// requirement. Extend this list if change-password ever needs a companion
// endpoint (e.g. a "who am I" check for the frontend to render the form).
const ALLOWED_WHILE_MUST_CHANGE_PASSWORD = new Set([
  "/auth/change-password",
  "/auth/logout",
]);

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing or malformed Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as AccessTokenPayload;
    req.user = payload;

    const pathWithoutQuery = req.originalUrl.split("?")[0];
    if (payload.mustChangePassword && !ALLOWED_WHILE_MUST_CHANGE_PASSWORD.has(pathWithoutQuery)) {
      next(
        new ForbiddenError(
          "Password change required before continuing. Call POST /auth/change-password."
        )
      );
      return;
    }

    next();
  } catch {
    // Covers both TokenExpiredError and JsonWebTokenError (malformed/invalid
    // signature) — the caller doesn't need to distinguish these, both mean
    // "log in again."
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}