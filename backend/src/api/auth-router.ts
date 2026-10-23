// ============================================================================
// Auth Router
// Endpoints for Admin and Shopkeeper login & session validation
// ============================================================================

import { Router, Request, Response } from "express";
import { AuthService } from "@/auth/auth-service";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", (req: Request, res: Response) => {
  const { email, password, phone } = req.body;

  // 1. Admin Email & Password login check
  if (email) {
    if (
      email.toLowerCase() === "rajanprasaila@gmail.com" &&
      password === "Rajan123@"
    ) {
      const adminUser = {
        id: "admin-rajan-01",
        shopId: "00000000-0000-0000-0000-000000000001",
        email: "rajanprasaila@gmail.com",
        phone: "9876543210",
        name: "Rajan Prasaila (Admin)",
        role: "ADMIN" as const,
      };
      const token = AuthService.generateToken(adminUser);
      return res.json({
        success: true,
        message: "Admin authenticated successfully",
        token,
        user: adminUser,
      });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid email or password",
    });
  }

  // 2. Phone fallback login
  if (phone) {
    const { user, token } = AuthService.demoLogin(phone);
    return res.json({
      success: true,
      message: "Logged in successfully",
      token,
      user,
    });
  }

  return res.status(400).json({ success: false, error: "Email & Password or Phone required" });
});

// GET /api/auth/me
authRouter.get("/me", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  const user = AuthService.verifyToken(token);
  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
  res.json({ success: true, user });
});
