// ============================================================================
// Orders API Router
// Creates orders with transactional stock subtraction
// ============================================================================

import { Router, Request, Response } from "express";
import { DatabaseService } from "@/services/db";
import { OrderCreateInput } from "@/types";

export const ordersRouter = Router();

// GET /api/orders
ordersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const shopId = (req.query.shopId as string) || "00000000-0000-0000-0000-000000000001";
    const orders = await DatabaseService.getOrders(shopId);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders - Place order and subtract stock
ordersRouter.post("/", async (req: Request, res: Response) => {
  try {
    const data: OrderCreateInput = req.body;

    if (!data.items || data.items.length === 0) {
      return res.status(400).json({ success: false, error: "Order must contain at least one item" });
    }

    if (!data.customerName || !data.customerPhone) {
      return res.status(400).json({ success: false, error: "Customer name and phone are required" });
    }

    const order = await DatabaseService.createOrder(data);
    res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id - Update status and payment status
ordersRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await DatabaseService.updateOrder(id, updates);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
