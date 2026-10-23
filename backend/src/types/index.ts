// ============================================================================
// Backend TypeScript Types & Interfaces
// ============================================================================

export type ProductUnit =
  | "kg"
  | "g"
  | "litre"
  | "ml"
  | "piece"
  | "packet"
  | "dozen"
  | "box"
  | "bottle"
  | "bundle";

export type ImageAspectRatio = "1:1" | "4:3" | "16:9";

export interface ProductInput {
  name: string;
  hindiName?: string;
  brand: string;
  categoryId?: string;
  unit: ProductUnit;
  unitStep?: number;
  mrp: number;
  sellingPrice: number;
  availableStock: number;
  minStockAlert?: number;
  barcode?: string;
  description?: string;
  aliases?: string[];
  primaryImageUrl?: string;
  imageAspectRatio?: ImageAspectRatio;
  imageCount?: number;
  additionalImages?: Array<{
    url: string;
    aspectRatio?: ImageAspectRatio;
    displayOrder?: number;
  }>;
}

export interface OrderItemInput {
  productId?: string;
  productName: string;
  unit: ProductUnit;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderCreateInput {
  shopId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  rawTranscript?: string;
  detectedLanguage?: string;
  isVoiceOrder?: boolean;
  paymentMode: "CASH" | "UPI_QR" | "CREDIT_UDHAAR";
  items: OrderItemInput[];
}

export interface ShopkeeperUser {
  id: string;
  shopId: string;
  phone: string;
  name: string;
  email?: string;
  role: "ADMIN" | "OWNER" | "STAFF" | "DELIVERY";
}
