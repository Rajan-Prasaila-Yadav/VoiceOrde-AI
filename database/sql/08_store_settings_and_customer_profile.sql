-- ============================================================================
-- SQL Script: 08_store_settings_and_customer_profile.sql
-- Store Settings & Customer Profile fields for billing & Google Maps integration
-- ============================================================================

-- 1. Extend shops table with full contact, maps, and fixed-ratio store/QR images
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) DEFAULT '110001',
ADD COLUMN IF NOT EXISTS landmark TEXT DEFAULT 'Near SBI Bank, Main Market',
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20) DEFAULT '+919876543210',
ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT 'sharmakirana@gmail.com',
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
ADD COLUMN IF NOT EXISTS qr_image_url TEXT DEFAULT 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=sharmakirana@upi&pn=SharmaKiranaStore&cu=INR',
ADD COLUMN IF NOT EXISTS google_maps_url TEXT DEFAULT 'https://maps.google.com/?q=28.6139,77.2090';

-- 2. Extend user_profiles table for customer profile completion gateway
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS landmark TEXT,
ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT FALSE;

-- 3. Extend customers table for bill generation & delivery location
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT FALSE;
