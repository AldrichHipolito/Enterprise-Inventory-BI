// src/modules/auth/auth.controller.ts
//
// Controllers are thin on purpose: validate input against the DTO, call the
// service, send the response. No business logic here — that all lives in
// auth.service.ts. Errors are thrown, not caught here — they bubble up to
// the central error-handling middleware you'll add in app.ts, which reads
// error.statusCode off any AppError subclass (see lib/errors.ts).
//
// PATTERN TO REUSE: every controller method in every future module follows
// this exact three-step shape (validate -> call service -> respond).

import type { NextFunction, Request, Response } from "express";

import { loginSchema, changePasswordSchema } from "./auth.dto";
import { login, changePassword } from "./auth.service";

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await login(input, req.ip ?? null);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function changePasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = changePasswordSchema.parse(req.body);
    // console.log("Received:", input);
    await changePassword(req.user!.sub, input);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
}

export async function dashboardController(req: Request, res: Response, next: NextFunction) {
  // try {
  //   const input = changePasswordSchema.parse(req.body);
  //   console.log("Received:", input);
  //   await changePassword(req.user!.sub, input);

  //   res.status(200).json({ message: "Password changed successfully" });
  // } catch (error) {
  //   next(error);
  // }
}