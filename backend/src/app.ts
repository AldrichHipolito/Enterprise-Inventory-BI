/// <reference path="./types/express.d.ts" />
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./modules/auth/auth.routes";

import type { NextFunction, Request, Response } from "express";
import { isAppError } from "./lib/errors";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.use("/auth", authRoutes);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (isAppError(error)) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  console.error(error); // unexpected errors — log for debugging
  res.status(500).json({ message: "An unexpected error occurred" });
});

export default app;