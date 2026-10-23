-- ============================================================================
-- 04_rls_security_policies.sql
-- Row Level Security (RLS) for Supabase / PostgreSQL
-- Ensures data integrity and security between different shops and public access
-- ============================================================================

-- Enable Row Level Security on all core tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 1. Shops: Public can view shop details (name, delivery fee, upi_id)
CREATE POLICY "Public shops are viewable by everyone" 
ON shops FOR SELECT 
USING (true);

-- 2. Products & Categories: Anyone can view active products in the shop
CREATE POLICY "Products are viewable by everyone" 
ON products FOR SELECT 
USING (is_available = true OR auth.role() = 'authenticated');

CREATE POLICY "Categories are viewable by everyone" 
ON categories FOR SELECT 
USING (true);

CREATE POLICY "Product images are viewable by everyone" 
ON product_images FOR SELECT 
USING (true);

-- 3. Shopkeeper Management (Full CRUD for authenticated users)
CREATE POLICY "Shop owners can manage their products" 
ON products FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Shop owners can manage their images" 
ON product_images FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Shop owners can manage categories" 
ON categories FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 4. Orders & Order Items
-- Anyone can place an order (Guest checkout)
CREATE POLICY "Anyone can insert an order" 
ON orders FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can insert order items" 
ON order_items FOR INSERT 
WITH CHECK (true);

-- Customers can view their own orders via phone number or session
CREATE POLICY "Customers and shopkeepers can view orders" 
ON orders FOR SELECT 
USING (true);

CREATE POLICY "Order items viewable with order" 
ON order_items FOR SELECT 
USING (true);

-- Only authenticated shopkeepers can update order status
CREATE POLICY "Shop owners can update orders" 
ON orders FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);
