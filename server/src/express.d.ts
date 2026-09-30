import type { AuthenticatedUser } from "@resolveai/shared";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export {};
