-- ============================================================================
-- 01_tables_and_types.sql
-- VoiceOrder AI Database Schema (PostgreSQL / Supabase)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
DO $$ BEGIN
    CREATE TYPE product_unit_type AS ENUM (
        'kg', 'g', 'litre', 'ml', 'piece', 'packet', 'dozen', 'box', 'bottle', 'bundle'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM (
        'PLACED', 'ACCEPTED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_mode_type AS ENUM (
        'CASH', 'UPI_QR', 'CREDIT_UDHAAR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM (
        'UNPAID', 'PAID', 'PARTIALLY_PAID'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Shops Table
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    upi_id VARCHAR(100),
    address TEXT,
    delivery_radius_km NUMERIC(5, 2) DEFAULT 5.0,
    delivery_fee_fixed NUMERIC(10, 2) DEFAULT 0.0,
    delivery_free_above NUMERIC(10, 2) DEFAULT 500.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    hindi_name VARCHAR(100),
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shop_id, slug)
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Identification
    name VARCHAR(255) NOT NULL,
    hindi_name VARCHAR(255),
    aliases TEXT[] DEFAULT '{}',
    brand VARCHAR(150),
    barcode VARCHAR(100),
    description TEXT,
    
    -- Pricing & Unit
    unit product_unit_type NOT NULL DEFAULT 'piece',
    unit_step NUMERIC(10, 3) DEFAULT 1.0, -- e.g. 0.5 for half kg increments
    mrp NUMERIC(10, 2) NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL,
    
    -- Stock & Inventory Tracking
    available_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    sold_count NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    min_stock_alert NUMERIC(10, 2) DEFAULT 5.0,
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Image configuration
    primary_image_url TEXT,
    image_aspect_ratio VARCHAR(10) DEFAULT '1:1', -- '1:1', '4:3', '16:9'
    image_count INT DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Product Images Table (Multi-image support with fixed aspect ratio metadata)
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    aspect_ratio VARCHAR(10) DEFAULT '1:1',
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    landmark TEXT,
    notes TEXT,
    credit_balance NUMERIC(10, 2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shop_id, phone)
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL UNIQUE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Customer snapshot (captured at order time)
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    
    -- Voice & Language Metadata
    audio_url TEXT,
    raw_transcript TEXT,
    detected_language VARCHAR(20) DEFAULT 'hi-IN',
    is_voice_order BOOLEAN DEFAULT TRUE,
    
    -- Pricing totals (server calculated)
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    
    -- Lifecycle
    status order_status_type DEFAULT 'PLACED',
    payment_mode payment_mode_type DEFAULT 'CASH',
    payment_status payment_status_type DEFAULT 'UNPAID',
    
    -- Feedback
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Snapshot values (locked at order creation)
    product_name VARCHAR(255) NOT NULL,
    unit product_unit_type NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
