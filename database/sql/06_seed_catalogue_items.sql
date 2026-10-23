-- ============================================================================
-- 06_seed_catalogue_items.sql / 20261024000001_seed_catalogue_items.sql
-- 50 Real Kirana Catalogue Items (10 Items in 5 Popular Categories)
-- Realistic Indian prices, proper units, Hindi aliases, and high-quality images
-- ============================================================================

DO $$ 
DECLARE
    v_shop_id UUID := '00000000-0000-0000-0000-000000000001';
    v_cat_grains UUID;
    v_cat_oil UUID;
    v_cat_dairy UUID;
    v_cat_pulses UUID;
    v_cat_spices UUID;
BEGIN
    -- Ensure Default Shop exists
    INSERT INTO shops (id, name, owner_name, phone, upi_id, address)
    VALUES (
        v_shop_id,
        'Sharma Kirana & General Store',
        'Rajan Prasaila (Admin)',
        '9876543210',
        'sharma.kirana@upi',
        'Shop No. 12, Main Market'
    )
    ON CONFLICT (phone) DO UPDATE 
    SET name = 'Sharma Kirana & General Store';

    -- 1. Create or Get Categories
    INSERT INTO categories (shop_id, name, hindi_name, slug)
    VALUES (v_shop_id, 'Flour & Grains', 'अनाज और आटा', 'grains-flour')
    ON CONFLICT (shop_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_grains;

    INSERT INTO categories (shop_id, name, hindi_name, slug)
    VALUES (v_shop_id, 'Oil & Ghee', 'तेल और घी', 'oil-ghee')
    ON CONFLICT (shop_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_oil;

    INSERT INTO categories (shop_id, name, hindi_name, slug)
    VALUES (v_shop_id, 'Dairy & Butter', 'डेयरी उत्पाद', 'dairy-butter')
    ON CONFLICT (shop_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_dairy;

    INSERT INTO categories (shop_id, name, hindi_name, slug)
    VALUES (v_shop_id, 'Pulses & Dal', 'दालें', 'pulses-dal')
    ON CONFLICT (shop_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_pulses;

    INSERT INTO categories (shop_id, name, hindi_name, slug)
    VALUES (v_shop_id, 'Spices, Salt & Tea', 'मसाले, नमक और चाय', 'spices-salt-tea')
    ON CONFLICT (shop_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_spices;

    -- ========================================================================
    -- CATEGORY 1: FLOUR & GRAINS (10 ITEMS)
    -- ========================================================================
    INSERT INTO products (shop_id, category_id, name, hindi_name, brand, unit, unit_step, mrp, selling_price, available_stock, sold_count, aliases, primary_image_url, image_aspect_ratio)
    VALUES
    (v_shop_id, v_cat_grains, 'Aashirvaad Sharbati Whole Wheat Atta', 'आशीर्वाद शरबती आटा', 'Aashirvaad', 'kg', 1.0, 290.0, 265.0, 45.0, 0.0, 
     ARRAY['aata', 'atta', 'gehu atta', 'aashirwad atta'], 
     'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_grains, 'Fortune Chakki Fresh Atta', 'फॉर्च्यून चक्की फ्रेश आटा', 'Fortune', 'kg', 1.0, 275.0, 245.0, 30.0, 0.0, 
     ARRAY['fortune atta', 'chakki atta'], 
     'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_grains, 'India Gate Basmati Rice Classic', 'इंडिया गेट बासमती चावल', 'India Gate', 'kg', 1.0, 180.0, 155.0, 50.0, 0.0, 
     ARRAY['chawal', 'basmati', 'rice', 'india gate chawal'], 
     'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_grains, 'Daawat Rozana Super Basmati Rice', 'दावत रोज़ाना बासमती चावल', 'Daawat', 'kg', 1.0, 130.0, 115.0, 40.0, 0.0, 
     ARRAY['daawat chawal', 'rozana rice', 'regular chawal'], 
     'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_grains, 'Rajdhani Pure Besan', 'राजधानी बेसन', 'Rajdhani', 'kg', 0.5, 120.0, 105.0, 35.0, 0.0, 
     ARRAY['besan', 'gram flour', 'chana flour'], 
     'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_grains, 'Pillsbury Traditional Chakki Atta', 'पिल्सबरी चक्की आटा', 'Pillsbury', 'kg', 1.0, 280.0, 250.0, 25.0, 0.0, 
     ARRAY['pillsbury atta'], 
     'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_grains, 'Fortune Biryani Special Basmati', 'फॉर्च्यून बिरयानी बासमती', 'Fortune', 'kg', 1.0, 210.0, 185.0, 20.0, 0.0, 
     ARRAY['biryani rice', 'biryani chawal'], 
     'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_grains, 'Rajdhani Premium Sooji / Rawa', 'राजधानी सूजी रवा', 'Rajdhani', 'packet', 1.0, 45.0, 38.0, 60.0, 0.0, 
     ARRAY['suji', 'sooji', 'rawa', 'rava'], 
     'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_grains, 'Natureland Thick Poha (Flaked Rice)', 'नेचरलैंड मोटा पोहा', 'Natureland', 'packet', 1.0, 65.0, 52.0, 50.0, 0.0, 
     ARRAY['poha', 'chivda', 'flaked rice'], 
     'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_grains, 'Quaker Rolled Whole Oats', 'क्वेकर रोल्ड ओट्स', 'Quaker', 'packet', 1.0, 199.0, 175.0, 30.0, 0.0, 
     ARRAY['oats', 'quaker oats', 'daliya'], 
     'https://images.unsplash.com/photo-1614961908595-6549a1506bf9?w=600&auto=format&fit=crop&q=80', '1:1');

    -- ========================================================================
    -- CATEGORY 2: OIL & GHEE (10 ITEMS)
    -- ========================================================================
    INSERT INTO products (shop_id, category_id, name, hindi_name, brand, unit, unit_step, mrp, selling_price, available_stock, sold_count, aliases, primary_image_url, image_aspect_ratio)
    VALUES
    (v_shop_id, v_cat_oil, 'Fortune Sunlite Refined Sunflower Oil', 'फॉर्च्यून रिफाइंड सूरजमुखी तेल', 'Fortune', 'litre', 1.0, 160.0, 142.0, 40.0, 0.0, 
     ARRAY['sunflower tel', 'meetha tel', 'refined tel', 'refined oil'], 
     'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_oil, 'Dhara Kachi Ghani Mustard Oil', 'धारा कच्ची घानी सरसों तेल', 'Dhara', 'litre', 1.0, 175.0, 155.0, 35.0, 0.0, 
     ARRAY['sarson tel', 'mustard oil', 'dhara sarso'], 
     'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_oil, 'Saffola Gold Pro Healthy Blend Oil', 'सफोला गोल्ड ऑयल', 'Saffola', 'litre', 1.0, 195.0, 170.0, 25.0, 0.0, 
     ARRAY['saffola', 'saffola oil'], 
     'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_oil, 'Amul Pure Desi Ghee Pouch', 'अमुल शुद्ध देसी घी', 'Amul', 'litre', 1.0, 650.0, 595.0, 30.0, 0.0, 
     ARRAY['amul ghee', 'desi ghee', 'ghee'], 
     'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_oil, 'Patanjali Cow Desi Ghee Tin', 'पतंजलि गाय का देसी घी', 'Patanjali', 'litre', 1.0, 675.0, 620.0, 20.0, 0.0, 
     ARRAY['cow ghee', 'patanjali ghee', 'gai ka ghee'], 
     'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_oil, 'Fortune Premium Mustard Oil Jar', 'फॉर्च्यून सरसों तेल जार', 'Fortune', 'bottle', 1.0, 850.0, 760.0, 15.0, 0.0, 
     ARRAY['mustard can', 'sarson jar', '5 litre tel'], 
     'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_oil, 'Gemini Pure Refined Soyabean Oil', 'जेमिनी सोयाबीन तेल', 'Gemini', 'litre', 1.0, 145.0, 128.0, 35.0, 0.0, 
     ARRAY['soyabean oil', 'soya tel'], 
     'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_oil, 'Emami Healthy & Tasty Mustard Oil', 'इमामी सरसों तेल', 'Emami', 'litre', 1.0, 165.0, 148.0, 25.0, 0.0, 
     ARRAY['emami tel', 'emami mustard'], 
     'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_oil, 'Anveshan Wood Pressed Groundnut Oil', 'अन्वेषण मूंगफली तेल', 'Anveshan', 'litre', 1.0, 340.0, 299.0, 15.0, 0.0, 
     ARRAY['mungfali tel', 'groundnut oil', 'sing tel'], 
     'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_oil, 'Mother Dairy Pure Buffalo Ghee', 'मदर डेयरी शुद्ध घी', 'Mother Dairy', 'bottle', 1.0, 330.0, 299.0, 25.0, 0.0, 
     ARRAY['mother dairy ghee', 'adhe kilo ghee'], 
     'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80', '1:1');

    -- ========================================================================
    -- CATEGORY 3: DAIRY & BUTTER (10 ITEMS)
    -- ========================================================================
    INSERT INTO products (shop_id, category_id, name, hindi_name, brand, unit, unit_step, mrp, selling_price, available_stock, sold_count, aliases, primary_image_url, image_aspect_ratio)
    VALUES
    (v_shop_id, v_cat_dairy, 'Amul Pasteurized Salted Butter', 'अमुल बटर मक्खन', 'Amul', 'packet', 1.0, 275.0, 260.0, 50.0, 0.0, 
     ARRAY['butter', 'makhan', 'amul butter', 'maska'], 
     'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_dairy, 'Amul Taaza Toned Milk Tetra Pack', 'अमुल ताज़ा दूध', 'Amul', 'packet', 1.0, 72.0, 68.0, 40.0, 0.0, 
     ARRAY['doodh', 'milk', 'amul doodh', 'toned milk'], 
     'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_dairy, 'Amul Fresh Malai Paneer', 'अमुल ताजा मलाई पनीर', 'Amul', 'packet', 1.0, 95.0, 88.0, 30.0, 0.0, 
     ARRAY['paneer', 'amul paneer', 'cottage cheese'], 
     'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_dairy, 'Britannia Cheese Slices Pack', 'ब्रिटानिया चीज़ स्लाइस', 'Britannia', 'packet', 1.0, 160.0, 142.0, 30.0, 0.0, 
     ARRAY['cheese', 'cheese slice', 'britannia cheese'], 
     'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_dairy, 'Amul Masti Spiced Buttermilk', 'अमुल मस्ती छाछ', 'Amul', 'packet', 1.0, 15.0, 15.0, 60.0, 0.0, 
     ARRAY['chaas', 'chach', 'buttermilk', 'amul masti'], 
     'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_dairy, 'Amul Processed Cheese Block', 'अमुल चीज़ क्यूब ब्लॉक', 'Amul', 'packet', 1.0, 135.0, 125.0, 35.0, 0.0, 
     ARRAY['cheese block', 'amul cheese'], 
     'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_dairy, 'Mother Dairy Classic Dahi Cup', 'मदर डेयरी ताज़ा दही', 'Mother Dairy', 'packet', 1.0, 45.0, 42.0, 45.0, 0.0, 
     ARRAY['dahi', 'curd', 'yogurt'], 
     'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_dairy, 'Amul Low Fat Fresh Cream', 'अमुल ताज़ा फ्रेश क्रीम', 'Amul', 'packet', 1.0, 65.0, 60.0, 25.0, 0.0, 
     ARRAY['malai', 'fresh cream', 'amul cream'], 
     'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_dairy, 'Gowardhan Pure Cow Ghee & Paneer Set', 'गोवर्धन पनीर', 'Gowardhan', 'packet', 1.0, 110.0, 98.0, 20.0, 0.0, 
     ARRAY['gowardhan paneer'], 
     'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_dairy, 'Mother Dairy Diet Dahi Pouch', 'मदर डेयरी गाय का दूध', 'Mother Dairy', 'packet', 1.0, 34.0, 32.0, 50.0, 0.0, 
     ARRAY['mother dairy milk', 'doodh packet'], 
     'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80', '1:1');

    -- ========================================================================
    -- CATEGORY 4: PULSES & DAL (10 ITEMS)
    -- ========================================================================
    INSERT INTO products (shop_id, category_id, name, hindi_name, brand, unit, unit_step, mrp, selling_price, available_stock, sold_count, aliases, primary_image_url, image_aspect_ratio)
    VALUES
    (v_shop_id, v_cat_pulses, 'Tata Sampann Unpolished Toor Dal', 'टाटा सम्पन्न अरहर तुवर दाल', 'Tata Sampann', 'kg', 1.0, 195.0, 172.0, 45.0, 0.0, 
     ARRAY['toor dal', 'tuvar dal', 'arhar dal', 'peeli dal'], 
     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_pulses, 'Tata Sampann Yellow Moong Dal Dhuli', 'टाटा सम्पन्न पीली मूँग दाल', 'Tata Sampann', 'kg', 1.0, 160.0, 140.0, 40.0, 0.0, 
     ARRAY['moong dal', 'peeli moong', 'yellow dal'], 
     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_pulses, 'Rajdhani Premium Chana Dal', 'राजधानी चना दाल', 'Rajdhani', 'kg', 1.0, 110.0, 96.0, 50.0, 0.0, 
     ARRAY['chana dal', 'chane ki dal'], 
     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_pulses, 'Fortune Unpolished Masoor Malka Dal', 'फॉर्च्यून मसूर मलका दाल', 'Fortune', 'kg', 1.0, 125.0, 108.0, 35.0, 0.0, 
     ARRAY['masoor dal', 'malka dal', 'lal dal'], 
     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_pulses, 'Tata Sampann Urad Dal Split (Chilka)', 'टाटा सम्पन्न उड़द दाल', 'Tata Sampann', 'kg', 1.0, 170.0, 150.0, 30.0, 0.0, 
     ARRAY['urad dal', 'kaali dal', 'urad split'], 
     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_pulses, 'Rajdhani White Kabuli Chana', 'राजधानी काबुली चना छोले', 'Rajdhani', 'kg', 1.0, 180.0, 158.0, 40.0, 0.0, 
     ARRAY['chole', 'kabuli chana', 'safed chana', 'chickpeas'], 
     'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_pulses, 'Catch Kashmiri Rajma Red Kidney Beans', 'कश्मीरी राजमा', 'Catch', 'kg', 1.0, 190.0, 168.0, 30.0, 0.0, 
     ARRAY['rajma', 'red rajma', 'kashmiri rajma'], 
     'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_pulses, '24 Mantra Organic Desi Kala Chana', 'देसी काला चना', '24 Mantra', 'kg', 1.0, 115.0, 98.0, 45.0, 0.0, 
     ARRAY['kala chana', 'chana', 'brown chana'], 
     'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_pulses, 'Tata Sampann Moong Dal Whole (Sabut)', 'टाटा सम्पन्न साबुत मूँग', 'Tata Sampann', 'kg', 1.0, 150.0, 132.0, 25.0, 0.0, 
     ARRAY['sabut moong', 'green moong', 'hari moong'], 
     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_pulses, 'Rajdhani Urad Gota (Sabut White)', 'राजधानी सफेद उड़द साबुता', 'Rajdhani', 'kg', 1.0, 175.0, 155.0, 20.0, 0.0, 
     ARRAY['urad gota', 'idli dal', 'safed urad'], 
     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80', '1:1');

    -- ========================================================================
    -- CATEGORY 5: SPICES, SALT & TEA (10 ITEMS)
    -- ========================================================================
    INSERT INTO products (shop_id, category_id, name, hindi_name, brand, unit, unit_step, mrp, selling_price, available_stock, sold_count, aliases, primary_image_url, image_aspect_ratio)
    VALUES
    (v_shop_id, v_cat_spices, 'Tata Salt Vacuum Evaporated Iodised', 'टाटा नमक', 'Tata', 'kg', 1.0, 28.0, 26.0, 100.0, 0.0, 
     ARRAY['namak', 'salt', 'tata namak', 'iodine salt'], 
     'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_spices, 'Everest Pure Turmeric Powder (Haldi)', 'एवरेस्ट हल्दी पाउडर', 'Everest', 'packet', 1.0, 68.0, 58.0, 60.0, 0.0, 
     ARRAY['haldi', 'turmeric', 'haldi powder', 'everest haldi'], 
     'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_spices, 'MDH Deggi Mirch Natural Red Chilli', 'एमडीएच देगी मिर्च', 'MDH', 'packet', 1.0, 95.0, 84.0, 50.0, 0.0, 
     ARRAY['mirchi', 'chilli powder', 'lal mirch', 'degi mirch'], 
     'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_spices, 'Catch Pure Coriander Powder (Dhaniya)', 'कैच धनिया पाउडर', 'Catch', 'packet', 1.0, 75.0, 62.0, 40.0, 0.0, 
     ARRAY['dhaniya', 'coriander powder', 'dhana'], 
     'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_spices, 'MDH Super Garam Masala Blend', 'एमडीएच गरम मसाला', 'MDH', 'packet', 1.0, 110.0, 98.0, 45.0, 0.0, 
     ARRAY['garam masala', 'sabji masala', 'mdh masala'], 
     'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_spices, 'Madhur Pure Refined Sulphurless Sugar', 'मधुर शुद्ध चीनी', 'Madhur', 'kg', 1.0, 56.0, 48.0, 80.0, 0.0, 
     ARRAY['chini', 'cheeni', 'sugar', 'shakkar'], 
     'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_spices, 'Brooke Bond Red Label Strong Tea', 'रेड लेबल चाय पत्ती', 'Red Label', 'packet', 1.0, 270.0, 240.0, 40.0, 0.0, 
     ARRAY['chai', 'chai patti', 'tea', 'red label chai'], 
     'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_spices, 'Tata Tea Gold CTC with Long Leaves', 'टाटा टी गोल्ड चाय', 'Tata Tea', 'packet', 1.0, 310.0, 275.0, 35.0, 0.0, 
     ARRAY['tata tea', 'tata gold', 'chai patti'], 
     'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_spices, 'Tata Salt Lite 15% Low Sodium', 'टाटा साल्ट लाइट नमक', 'Tata', 'kg', 1.0, 45.0, 40.0, 30.0, 0.0, 
     ARRAY['low sodium salt', 'sugar bp salt'], 
     'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80', '1:1'),

    (v_shop_id, v_cat_spices, 'Everest Pav Bhaji Special Masala', 'एवरेस्ट पाव भाजी मसाला', 'Everest', 'packet', 1.0, 48.0, 42.0, 50.0, 0.0, 
     ARRAY['pav bhaji masala', 'everest pav bhaji'], 
     'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80', '1:1');

END $$;
