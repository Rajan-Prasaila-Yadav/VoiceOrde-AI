-- ============================================================================
-- Supabase Migration: 20261024000000_init_voiceorder_schema.sql
-- VoiceOrder AI Clean Slate Database Migration
-- ============================================================================

-- Ensure search path includes public and extensions
SET search_path TO public, extensions;

-- 1. CLEANUP: Drop all existing leftover tables & views from previous projects
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all views in public schema
    FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;

    -- Drop all tables in public schema
    FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;
END $$;

-- 2. Types & Custom Enums
DO $$ BEGIN
    DROP TYPE IF EXISTS product_unit_type CASCADE;
    CREATE TYPE product_unit_type AS ENUM (
        'kg', 'g', 'litre', 'ml', 'piece', 'packet', 'dozen', 'box', 'bottle', 'bundle'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    DROP TYPE IF EXISTS order_status_type CASCADE;
    CREATE TYPE order_status_type AS ENUM (
        'PLACED', 'ACCEPTED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    DROP TYPE IF EXISTS payment_mode_type CASCADE;
    CREATE TYPE payment_mode_type AS ENUM (
        'CASH', 'UPI_QR', 'CREDIT_UDHAAR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    DROP TYPE IF EXISTS payment_status_type CASCADE;
    CREATE TYPE payment_status_type AS ENUM (
        'UNPAID', 'PAID', 'PARTIALLY_PAID'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Core Tables (Using native PostgreSQL gen_random_uuid())
CREATE TABLE shops (
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

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    hindi_name VARCHAR(100),
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shop_id, slug)
);

CREATE TABLE products (
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
    
    -- Unit & Pricing
    unit product_unit_type NOT NULL DEFAULT 'piece',
    unit_step NUMERIC(10, 3) DEFAULT 1.0,
    mrp NUMERIC(10, 2) NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL,
    
    -- Stock & Tracking (Automatically subtracted on orders)
    available_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    sold_count NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    min_stock_alert NUMERIC(10, 2) DEFAULT 5.0,
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Images (Fixed size, aspect ratio, image count)
    primary_image_url TEXT,
    image_aspect_ratio VARCHAR(10) DEFAULT '1:1',
    image_count INT DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    aspect_ratio VARCHAR(10) DEFAULT '1:1',
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customers (
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

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL UNIQUE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    
    audio_url TEXT,
    raw_transcript TEXT,
    detected_language VARCHAR(20) DEFAULT 'hi-IN',
    is_voice_order BOOLEAN DEFAULT TRUE,
    
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    
    status order_status_type DEFAULT 'PLACED',
    payment_mode payment_mode_type DEFAULT 'CASH',
    payment_status payment_status_type DEFAULT 'UNPAID',
    
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    product_name VARCHAR(255) NOT NULL,
    unit product_unit_type NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Profiles & Role-Based Access Control
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Admin User (rajanprasaila@gmail.com / Rajan123@)
INSERT INTO app_users (email, password_hash, full_name, role)
VALUES (
    'rajanprasaila@gmail.com',
    'sha256:1841a4e6625309566f93e83445826f85b7fd2dc28a7fd1ecf2b3746b6da90a7f',
    'Rajan Prasaila (Admin)',
    'ADMIN'
);

INSERT INTO user_profiles (email, full_name, role)
VALUES (
    'rajanprasaila@gmail.com',
    'Rajan Prasaila (Admin)',
    'ADMIN'
);

-- Trigger: When ANY user signs in or registers via Google:
-- ALWAYS assign 'CUSTOMER' unless the email is explicitly rajanprasaila@gmail.com!
CREATE OR REPLACE FUNCTION public.handle_auth_user_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (auth_user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
        CASE 
            WHEN LOWER(NEW.email) = 'rajanprasaila@gmail.com' THEN 'ADMIN'
            ELSE 'CUSTOMER'
        END
    )
    ON CONFLICT (email) DO UPDATE
    SET 
        auth_user_id = EXCLUDED.auth_user_id,
        role = CASE 
            WHEN LOWER(EXCLUDED.email) = 'rajanprasaila@gmail.com' THEN 'ADMIN'
            ELSE 'CUSTOMER'
        END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users if available
DO $$ BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_role();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

-- 5. Automatic Stock Deduction Trigger
CREATE OR REPLACE FUNCTION deduct_product_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    current_stock NUMERIC(10, 2);
    prod_name VARCHAR(255);
BEGIN
    IF NEW.product_id IS NOT NULL THEN
        SELECT available_stock, name INTO current_stock, prod_name
        FROM products
        WHERE id = NEW.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found', NEW.product_id;
        END IF;

        IF current_stock < NEW.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product "%": requested %, available %', 
                prod_name, NEW.quantity, current_stock;
        END IF;

        UPDATE products
        SET 
            available_stock = available_stock - NEW.quantity,
            sold_count = sold_count + NEW.quantity,
            is_available = CASE 
                WHEN (available_stock - NEW.quantity) <= 0 THEN FALSE 
                ELSE is_available 
            END,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deduct_stock ON order_items;
CREATE TRIGGER trigger_deduct_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION deduct_product_stock_on_order();

-- 6. Replenish Stock on Cancellation
CREATE OR REPLACE FUNCTION replenish_product_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.product_id IS NOT NULL THEN
        UPDATE products
        SET 
            available_stock = available_stock + OLD.quantity,
            sold_count = GREATEST(0, sold_count - OLD.quantity),
            is_available = TRUE,
            updated_at = NOW()
        WHERE id = OLD.product_id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_replenish_stock ON order_items;
CREATE TRIGGER trigger_replenish_stock
AFTER DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION replenish_product_stock_on_cancel();

-- 7. Seed Default Shop
INSERT INTO shops (id, name, owner_name, phone, upi_id, address)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Sharma Kirana & General Store',
    'Rajan Prasaila (Admin)',
    '9876543210',
    'sharma.kirana@upi',
    'Shop No. 12, Main Market'
);
