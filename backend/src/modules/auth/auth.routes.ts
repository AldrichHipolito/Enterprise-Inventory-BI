// src/modules/auth/auth.routes.ts
//
// Defines this module's URL paths and wires each one to its controller
// method. Mounted in app.ts with a prefix, e.g. app.use("/auth", authRoutes)
// -> this file's "/login" becomes the full path "/auth/login".
//
// PATTERN TO REUSE: every module gets one of these. Public routes (like
// login itself) skip the `authenticate` middleware; everything else in the
// app should have `authenticate` (and usually `authorize`) in its chain.

import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";

import { loginController, changePasswordController, dashboardController } from "./auth.controller";

const router = Router();

router.post("/login", loginController);
router.post("/change-password", authenticate, changePasswordController);
router.post("/dashboard", dashboardController);

export default router;