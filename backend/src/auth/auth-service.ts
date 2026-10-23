// ============================================================================
// Shopkeeper Authentication Service
// Handles JWT generation, phone login, and shop association
// ============================================================================

import jwt from "jsonwebtoken";
import { ShopkeeperUser } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "voiceorder-secret-key-2026";

export class AuthService {
  /**
   * Generate access token for shopkeeper
   */
  static generateToken(user: ShopkeeperUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
  }

  /**
   * Verify access token
   */
  static verifyToken(token: string): ShopkeeperUser | null {
    try {
      return jwt.verify(token, JWT_SECRET) as ShopkeeperUser;
    } catch {
      return null;
    }
  }

  /**
   * Mock login for demo/testing
   */
  static demoLogin(phone: string): { user: ShopkeeperUser; token: string } {
    const user: ShopkeeperUser = {
      id: "user-sharma-1",
      shopId: "00000000-0000-0000-0000-000000000001",
      phone,
      name: "Ramesh Sharma",
      role: "OWNER",
    };
    const token = this.generateToken(user);
    return { user, token };
  }
}
