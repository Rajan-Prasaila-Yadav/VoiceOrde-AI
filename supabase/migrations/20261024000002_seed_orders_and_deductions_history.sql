-- ============================================================================
-- Supabase Migration: 20261024000002_seed_orders_and_deductions_history.sql
-- Real Historical Voice Orders, Customer Records, and Live Stock Deductions
-- Sharma Kirana & General Store
-- ============================================================================

DO $$ 
DECLARE
    v_shop_id UUID := '00000000-0000-0000-0000-000000000001';
    
    -- Customer IDs
    v_cust_1 UUID := gen_random_uuid();
    v_cust_2 UUID := gen_random_uuid();
    v_cust_3 UUID := gen_random_uuid();
    v_cust_4 UUID := gen_random_uuid();
    v_cust_5 UUID := gen_random_uuid();
    v_cust_6 UUID := gen_random_uuid();
    v_cust_7 UUID := gen_random_uuid();
    v_cust_8 UUID := gen_random_uuid();

    -- Order IDs
    v_ord_1 UUID := gen_random_uuid();
    v_ord_2 UUID := gen_random_uuid();
    v_ord_3 UUID := gen_random_uuid();
    v_ord_4 UUID := gen_random_uuid();
    v_ord_5 UUID := gen_random_uuid();
    v_ord_6 UUID := gen_random_uuid();
    v_ord_7 UUID := gen_random_uuid();
    v_ord_8 UUID := gen_random_uuid();
    v_ord_9 UUID := gen_random_uuid();
    v_ord_10 UUID := gen_random_uuid();
    v_ord_11 UUID := gen_random_uuid();
    v_ord_12 UUID := gen_random_uuid();

    -- Product variables to reference real items
    v_p_aashirvaad UUID;
    v_p_rice UUID;
    v_p_butter UUID;
    v_p_milk UUID;
    v_p_paneer UUID;
    v_p_oil UUID;
    v_p_ghee UUID;
    v_p_toor UUID;
    v_p_tea UUID;
    v_p_salt UUID;
    v_p_garam_masala UUID;
BEGIN
    -- 1. Grab IDs of seeded products
    SELECT id INTO v_p_aashirvaad FROM products WHERE name ILIKE '%Aashirvaad Sharbati%' LIMIT 1;
    SELECT id INTO v_p_rice FROM products WHERE name ILIKE '%India Gate Basmati%' LIMIT 1;
    SELECT id INTO v_p_butter FROM products WHERE name ILIKE '%Amul Salted Butter%' LIMIT 1;
    SELECT id INTO v_p_milk FROM products WHERE name ILIKE '%Amul Taaza Fresh Toned Milk%' LIMIT 1;
    SELECT id INTO v_p_paneer FROM products WHERE name ILIKE '%Amul Malai Fresh Paneer%' LIMIT 1;
    SELECT id INTO v_p_oil FROM products WHERE name ILIKE '%Fortune Kachi Ghani Mustard Oil%' LIMIT 1;
    SELECT id INTO v_p_ghee FROM products WHERE name ILIKE '%Amul Pure Cow Ghee%' LIMIT 1;
    SELECT id INTO v_p_toor FROM products WHERE name ILIKE '%Tata Sampann Unpolished Toor Dal%' LIMIT 1;
    SELECT id INTO v_p_tea FROM products WHERE name ILIKE '%Brooke Bond Red Label Tea%' LIMIT 1;
    SELECT id INTO v_p_salt FROM products WHERE name ILIKE '%Tata Salt Vacuum Evaporated Iodized%' LIMIT 1;
    SELECT id INTO v_p_garam_masala FROM products WHERE name ILIKE '%Everest Super Garam Masala%' LIMIT 1;

    -- 2. Seed Regular Customers
    INSERT INTO customers (id, shop_id, name, phone, address, landmark, credit_balance)
    VALUES
    (v_cust_1, v_shop_id, 'Sunita Devi', '9812345678', 'Flat 204, Radha Krishna Apts, Main Bazaar', 'Near Shiv Mandir', 0.0),
    (v_cust_2, v_shop_id, 'Ramesh Sharma', '9823456789', 'House 12, Gali No. 4, Mandir Marg', 'Opposite Post Office', 250.0),
    (v_cust_3, v_shop_id, 'Amit Verma', '9834567890', 'C-45, Shanti Niketan, Sector 5', 'Near Community Centre', 0.0),
    (v_cust_4, v_shop_id, 'Pooja Gupta', '9845678901', '102, Gokul Dham Society, Link Road', 'Behind Petrol Pump', 0.0),
    (v_cust_5, v_shop_id, 'Vikram Singh', '9856789012', 'Shop 3, Gandhi Chowk, Station Road', 'Near Metro Pillar 42', 650.0),
    (v_cust_6, v_shop_id, 'Anjali Nair', '9867890123', '15/B, Shiv Shakti Nagar, Water Tank', 'Behind Govt Hospital', 0.0),
    (v_cust_7, v_shop_id, 'Rajesh Patel', '9878901234', 'Plot 88, Green Park Extension', 'Near Central Park', 0.0),
    (v_cust_8, v_shop_id, 'Meena Agarwal', '9889012345', 'D-12, Krishna Colony, Old Market', 'Next to SBI ATM', 120.0)
    ON CONFLICT (shop_id, phone) DO UPDATE
    SET name = EXCLUDED.name, address = EXCLUDED.address;

    -- ========================================================================
    -- 3. SEED REALISTIC ORDERS WITH SPOKEN TRANSCRIPTS OVER PAST 7 DAYS
    -- ========================================================================

    -- ORDER 1: Placed 1 hour ago (Today)
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_1, 1001, v_shop_id, v_cust_1, 'Sunita Devi', '9812345678', 'Flat 204, Radha Krishna Apts, Main Bazaar',
        'दो किलो आटा, एक पैकेट अमूल बटर और एक किलो चीनी चाहिए', 'hi-IN', TRUE, 381.0, 0.0, 381.0,
        'DELIVERED', 'UPI_QR', 'PAID', NOW() - INTERVAL '1 hour'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_1, v_p_aashirvaad, 'Aashirvaad Sharbati Whole Wheat Atta', 'kg', 2.0, 265.0, 530.0),
    (v_ord_1, v_p_butter, 'Amul Salted Butter 100g', 'packet', 1.0, 56.0, 56.0);

    -- ORDER 2: Placed 3 hours ago (Today)
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_2, 1002, v_shop_id, v_cust_2, 'Ramesh Sharma', '9823456789', 'House 12, Gali No. 4, Mandir Marg',
        '1 litre Fortune mustard oil aur ek packet Tata salt aur ek packet Red Label chai', 'hi-IN', TRUE, 335.0, 0.0, 335.0,
        'DELIVERED', 'CREDIT_UDHAAR', 'UNPAID', NOW() - INTERVAL '3 hours'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_2, v_p_oil, 'Fortune Kachi Ghani Mustard Oil 1L', 'litre', 1.0, 165.0, 165.0),
    (v_ord_2, v_p_salt, 'Tata Salt Vacuum Evaporated Iodized 1kg', 'packet', 1.0, 26.0, 26.0),
    (v_ord_2, v_p_tea, 'Brooke Bond Red Label Tea 250g', 'packet', 1.0, 140.0, 140.0);

    -- ORDER 3: Placed 6 hours ago (Today)
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_3, 1003, v_shop_id, v_cust_3, 'Amit Verma', '9834567890', 'C-45, Shanti Niketan, Sector 5',
        'दो लीटर अमूल ताजा दूध और दो पैकेट पनीर भेज दो', 'hi-IN', TRUE, 268.0, 0.0, 268.0,
        'DELIVERED', 'UPI_QR', 'PAID', NOW() - INTERVAL '6 hours'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_3, v_p_milk, 'Amul Taaza Fresh Toned Milk 1L', 'litre', 2.0, 54.0, 108.0),
    (v_ord_3, v_p_paneer, 'Amul Malai Fresh Paneer 200g', 'packet', 2.0, 85.0, 170.0);

    -- ORDER 4: Yesterday Morning
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_4, 1004, v_shop_id, v_cust_4, 'Pooja Gupta', '9845678901', '102, Gokul Dham Society, Link Road',
        'Amul pure cow ghee ek litre aur ek packet Everest garam masala', 'hi-IN', TRUE, 745.0, 0.0, 745.0,
        'DELIVERED', 'CASH', 'PAID', NOW() - INTERVAL '1 day 2 hours'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_4, v_p_ghee, 'Amul Pure Cow Ghee 1L Tin', 'litre', 1.0, 645.0, 645.0),
    (v_ord_4, v_p_garam_masala, 'Everest Super Garam Masala 100g', 'packet', 1.0, 88.0, 88.0);

    -- ORDER 5: Yesterday Afternoon
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_5, 1005, v_shop_id, v_cust_5, 'Vikram Singh', '9856789012', 'Shop 3, Gandhi Chowk, Station Road',
        'पाँच किलो इंडिया गेट बासमती चावल और दो किलो तुअर दाल', 'hi-IN', TRUE, 1105.0, 0.0, 1105.0,
        'DELIVERED', 'CREDIT_UDHAAR', 'UNPAID', NOW() - INTERVAL '1 day 6 hours'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_5, v_p_rice, 'India Gate Basmati Rice Classic', 'kg', 5.0, 155.0, 775.0),
    (v_ord_5, v_p_toor, 'Tata Sampann Unpolished Toor Dal 1kg', 'kg', 2.0, 165.0, 330.0);

    -- ORDER 6: 2 Days Ago
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_6, 1006, v_shop_id, v_cust_6, 'Anjali Nair', '9867890123', '15/B, Shiv Shakti Nagar, Water Tank',
        'एक पैकेट आशीर्वाद आटा, एक लीटर सरसों तेल और दो पैकेट नमक', 'hi-IN', TRUE, 482.0, 0.0, 482.0,
        'DELIVERED', 'UPI_QR', 'PAID', NOW() - INTERVAL '2 days'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_6, v_p_aashirvaad, 'Aashirvaad Sharbati Whole Wheat Atta', 'kg', 1.0, 265.0, 265.0),
    (v_ord_6, v_p_oil, 'Fortune Kachi Ghani Mustard Oil 1L', 'litre', 1.0, 165.0, 165.0),
    (v_ord_6, v_p_salt, 'Tata Salt Vacuum Evaporated Iodized 1kg', 'packet', 2.0, 26.0, 52.0);

    -- ORDER 7: 3 Days Ago
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_7, 1007, v_shop_id, v_cust_7, 'Rajesh Patel', '9878901234', 'Plot 88, Green Park Extension',
        'do packet Red Label tea aur teen packet Amul butter', 'hi-IN', TRUE, 448.0, 0.0, 448.0,
        'DELIVERED', 'UPI_QR', 'PAID', NOW() - INTERVAL '3 days 4 hours'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_7, v_p_tea, 'Brooke Bond Red Label Tea 250g', 'packet', 2.0, 140.0, 280.0),
    (v_ord_7, v_p_butter, 'Amul Salted Butter 100g', 'packet', 3.0, 56.0, 168.0);

    -- ORDER 8: 4 Days Ago
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_8, 1008, v_shop_id, v_cust_8, 'Meena Agarwal', '9889012345', 'D-12, Krishna Colony, Old Market',
        'चार लीटर अमूल दूध और एक किलो तुअर दाल', 'hi-IN', TRUE, 381.0, 0.0, 381.0,
        'DELIVERED', 'CASH', 'PAID', NOW() - INTERVAL '4 days 1 hour'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_8, v_p_milk, 'Amul Taaza Fresh Toned Milk 1L', 'litre', 4.0, 54.0, 216.0),
    (v_ord_8, v_p_toor, 'Tata Sampann Unpolished Toor Dal 1kg', 'kg', 1.0, 165.0, 165.0);

    -- ORDER 9: 5 Days Ago
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_9, 1009, v_shop_id, v_cust_1, 'Sunita Devi', '9812345678', 'Flat 204, Radha Krishna Apts, Main Bazaar',
        'दो पैकेट पनीर और एक लीटर अमूल घी', 'hi-IN', TRUE, 815.0, 0.0, 815.0,
        'DELIVERED', 'UPI_QR', 'PAID', NOW() - INTERVAL '5 days 5 hours'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_9, v_p_paneer, 'Amul Malai Fresh Paneer 200g', 'packet', 2.0, 85.0, 170.0),
    (v_ord_9, v_p_ghee, 'Amul Pure Cow Ghee 1L Tin', 'litre', 1.0, 645.0, 645.0);

    -- ORDER 10: 6 Days Ago
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_10, 1010, v_shop_id, v_cust_3, 'Amit Verma', '9834567890', 'C-45, Shanti Niketan, Sector 5',
        'एक पैकेट आशीर्वाद आटा और दो किलो बासमती चावल', 'hi-IN', TRUE, 575.0, 0.0, 575.0,
        'DELIVERED', 'UPI_QR', 'PAID', NOW() - INTERVAL '6 days 2 hours'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_10, v_p_aashirvaad, 'Aashirvaad Sharbati Whole Wheat Atta', 'kg', 1.0, 265.0, 265.0),
    (v_ord_10, v_p_rice, 'India Gate Basmati Rice Classic', 'kg', 2.0, 155.0, 310.0);

    -- ORDER 11: Just Arrived (Pending / Packing)
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_11, 1011, v_shop_id, v_cust_4, 'Pooja Gupta', '9845678901', '102, Gokul Dham Society, Link Road',
        'दो पैकेट गरम मसाला और एक पैकेट चायपत्ती जल्दी भेज देना', 'hi-IN', TRUE, 316.0, 0.0, 316.0,
        'PACKING', 'UPI_QR', 'PAID', NOW() - INTERVAL '25 minutes'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_11, v_p_garam_masala, 'Everest Super Garam Masala 100g', 'packet', 2.0, 88.0, 176.0),
    (v_ord_11, v_p_tea, 'Brooke Bond Red Label Tea 250g', 'packet', 1.0, 140.0, 140.0);

    -- ORDER 12: Newest Voice Order (In Packing Queue)
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_phone, delivery_address,
        raw_transcript, detected_language, is_voice_order, subtotal, delivery_fee, total_amount,
        status, payment_mode, payment_status, created_at
    ) VALUES (
        v_ord_12, 1012, v_shop_id, v_cust_2, 'Ramesh Sharma', '9823456789', 'House 12, Gali No. 4, Mandir Marg',
        'तीन पैकेट अमूल बटर और एक पैकेट नमक', 'hi-IN', TRUE, 194.0, 0.0, 194.0,
        'PLACED', 'CASH', 'UNPAID', NOW() - INTERVAL '8 minutes'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, total_price)
    VALUES
    (v_ord_12, v_p_butter, 'Amul Salted Butter 100g', 'packet', 3.0, 56.0, 168.0),
    (v_ord_12, v_p_salt, 'Tata Salt Vacuum Evaporated Iodized 1kg', 'packet', 1.0, 26.0, 26.0);

    -- ========================================================================
    -- 4. UPDATE PRODUCT SOLD COUNTS & LIVE AVAILABLE STOCK TO MATCH HISTORY
    -- ========================================================================
    IF v_p_aashirvaad IS NOT NULL THEN
        UPDATE products SET sold_count = 4.0, available_stock = 41.0 WHERE id = v_p_aashirvaad;
    END IF;

    IF v_p_rice IS NOT NULL THEN
        UPDATE products SET sold_count = 7.0, available_stock = 43.0 WHERE id = v_p_rice;
    END IF;

    IF v_p_butter IS NOT NULL THEN
        UPDATE products SET sold_count = 7.0, available_stock = 13.0 WHERE id = v_p_butter;
    END IF;

    IF v_p_milk IS NOT NULL THEN
        UPDATE products SET sold_count = 6.0, available_stock = 14.0 WHERE id = v_p_milk;
    END IF;

    IF v_p_paneer IS NOT NULL THEN
        UPDATE products SET sold_count = 4.0, available_stock = 11.0 WHERE id = v_p_paneer;
    END IF;

    IF v_p_oil IS NOT NULL THEN
        UPDATE products SET sold_count = 2.0, available_stock = 28.0 WHERE id = v_p_oil;
    END IF;

    IF v_p_ghee IS NOT NULL THEN
        UPDATE products SET sold_count = 2.0, available_stock = 13.0 WHERE id = v_p_ghee;
    END IF;

    IF v_p_toor IS NOT NULL THEN
        UPDATE products SET sold_count = 3.0, available_stock = 37.0 WHERE id = v_p_toor;
    END IF;

    IF v_p_tea IS NOT NULL THEN
        UPDATE products SET sold_count = 4.0, available_stock = 36.0 WHERE id = v_p_tea;
    END IF;

    IF v_p_salt IS NOT NULL THEN
        UPDATE products SET sold_count = 4.0, available_stock = 56.0 WHERE id = v_p_salt;
    END IF;

    IF v_p_garam_masala IS NOT NULL THEN
        UPDATE products SET sold_count = 3.0, available_stock = 27.0 WHERE id = v_p_garam_masala;
    END IF;

END $$;
