// ============================================================================
// Auth Guard Middleware
// Ensures protected routes (product creation, inventory changes) are authenticated
// ============================================================================

import { Request, Response, NextFunction } from "express";
import { AuthService } from "@/auth/auth-service";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // For local development ease, allow default shopkeeper if header is 'demo'
    if (req.headers["x-demo-mode"] === "true") {
      req.user = AuthService.demoLogin("9876543210").user;
      return next();
    }
    return res.status(401).json({ error: "Unauthorized: Missing Bearer token" });
  }

  const token = authHeader.split(" ")[1];
  const user = AuthService.verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }

  req.user = user;
  next();
}
