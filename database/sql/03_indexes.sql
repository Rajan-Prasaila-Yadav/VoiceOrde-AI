-- ============================================================================
-- 03_indexes.sql
-- High-performance search & relational indexes
-- Supports fast catalogue matching in Hindi, Hinglish, and English
-- ============================================================================

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(is_available, available_stock);

-- Trigram GIN indexes for fuzzy text matching (Voice order resolution)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_hindi_name_trgm ON products USING gin (hindi_name gin_trgm_ops);

-- Order lookups
CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Customer lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(shop_id, phone);
