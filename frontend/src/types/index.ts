// ============================================================================
// Frontend TypeScript Types
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

export interface ProductImageInput {
  url: string;
  aspectRatio: ImageAspectRatio;
  displayOrder: number;
}

export interface ProductFormData {
  id?: string;
  shopId?: string;
  name: string;
  hindiName?: string;
  brand: string;
  categoryId?: string;
  categoryName?: string;
  unit: ProductUnit;
  unitStep: number;
  mrp: number;
  sellingPrice: number;
  availableStock: number;
  soldCount?: number;
  minStockAlert: number;
  isAvailable: boolean;
  barcode?: string;
  description?: string;
  aliases: string[];
  primaryImageUrl?: string;
  imageAspectRatio: ImageAspectRatio;
  imageCount: number;
  additionalImages?: ProductImageInput[];
}

export interface ProductItem extends ProductFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemInput {
  productId?: string;
  productName: string;
  unit: ProductUnit;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderInput {
  shopId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  rawTranscript?: string;
  detectedLanguage?: string;
  isVoiceOrder: boolean;
  paymentMode: "CASH" | "UPI_QR" | "CREDIT_UDHAAR";
  items: OrderItemInput[];
}

export interface OrderRecord {
  id: string;
  orderNumber: number;
  shopId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: "PLACED" | "ACCEPTED" | "PACKING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  paymentMode: "CASH" | "UPI_QR" | "CREDIT_UDHAAR";
  paymentStatus: "UNPAID" | "PAID" | "PARTIALLY_PAID";
  rawTranscript?: string;
  isVoiceOrder?: boolean;
  detectedLanguage: string;
  createdAt: string;
  items: Array<{
    id?: string;
    productId?: string;
    productName: string;
    unit: ProductUnit;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface ShopSettings {
  id?: string;
  name: string;
  ownerName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  landmark: string;
  pincode: string;
  googleMapsUrl: string;
  imageUrl: string;
  qrImageUrl: string;
  upiId: string;
}

export interface CustomerProfile {
  id?: string;
  email: string;
  fullName: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  landmark?: string;
  pincode: string;
  googleMapsUrl?: string;
  avatarUrl?: string;
  isProfileCompleted: boolean;
}
