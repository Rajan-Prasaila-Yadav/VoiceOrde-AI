// ============================================================================
// VoiceOrder AI Backend Server
// Express server with Gnani API proxy, Stock deduction, and Supabase / Prisma DB
// ============================================================================

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { productsRouter } from "@/api/products-router";
import { ordersRouter } from "@/api/orders-router";
import { gnaniRouter } from "@/api/gnani-router";
import { authRouter } from "@/api/auth-router";
import { errorHandler } from "@/middleware/error-middleware";

const app = express();
const PORT = process.env.PORT || 4000;

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// Body Parsers (allow base64 audio uploads)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/gnani", gnaniRouter);
app.use("/api/auth", authRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "VoiceOrder AI Backend",
    timestamp: new Date().toISOString(),
    gnaniKeyConfigured: Boolean(process.env.GNANI_API_KEY && process.env.GNANI_API_KEY !== "test-gnani-api-key"),
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 VoiceOrder AI Backend running on http://localhost:${PORT}`);
  console.log(`📡 Gnani API Proxy: Ready`);
  console.log(`📦 Stock deduction triggers: Active`);
});

export default app;
