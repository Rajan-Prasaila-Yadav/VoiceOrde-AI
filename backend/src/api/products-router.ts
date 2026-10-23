// ============================================================================
// Products API Router
// Endpoints for catalog creation, stock adjustment, editing, and deletion
// ============================================================================

import { Router, Request, Response } from "express";
import { DatabaseService } from "@/services/db";
import { ProductInput } from "@/types";

export const productsRouter = Router();

// GET /api/products
productsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const shopId = (req.query.shopId as string) || "00000000-0000-0000-0000-000000000001";
    const products = await DatabaseService.getProducts(shopId);
    res.json({ success: true, count: products.length, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products - Create a new product with full specifications
productsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const shopId = (req.body.shopId as string) || "00000000-0000-0000-0000-000000000001";
    const data: ProductInput = req.body;

    if (!data.name || !data.unit || data.sellingPrice === undefined || data.availableStock === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required product fields: name, unit, sellingPrice, availableStock",
      });
    }

    const created = await DatabaseService.createProduct(data, shopId);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/products/:id - Update product price, stock, or details
productsRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await DatabaseService.updateProduct(id, req.body);
    res.json({ success: true, message: "Product updated successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/products/:id - Delete product
productsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await DatabaseService.deleteProduct(id);
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products/:id/restock - Add units to available stock
productsRouter.post("/:id/restock", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { units } = req.body;
    if (!units || units <= 0) {
      return res.status(400).json({ success: false, error: "Invalid units count to restock" });
    }
    await DatabaseService.restockUnits(id, Number(units));
    res.json({ success: true, message: `Restocked ${units} units` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products/:id/sold - Manual in-store sold subtraction
productsRouter.post("/:id/sold", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { units } = req.body;
    if (!units || units <= 0) {
      return res.status(400).json({ success: false, error: "Invalid sold quantity" });
    }
    await DatabaseService.deductStock(id, Number(units));
    res.json({ success: true, message: `Deducted ${units} sold units from stock` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
