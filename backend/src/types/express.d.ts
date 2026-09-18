// src/types/express.d.ts
//
// Augments Express's Request type so `req.user` is typed everywhere in the
// app after authenticate.ts runs, without every controller needing to import
// AuthenticatedRequest or cast anything.
 
import type { AccessTokenPayload } from "../middleware/authenticate";
 
declare global {
  namespace Express {
    interface Request {
      /** Populated by middleware/authenticate.ts. Undefined on public routes
       *  (e.g. POST /auth/login itself) that never run that middleware. */
      user?: AccessTokenPayload;
    }
  }
}
 
// Required for TypeScript to treat this as a module augmentation file rather
// than a script (which would cause "Cannot redeclare block-scoped variable").
export {};