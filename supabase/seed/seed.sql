-- ==================================================================
-- SEED DATA FOR PRINTFLOW CUSTOM PRINTING OMS
-- ==================================================================

-- 1. SEED PRODUCTS
INSERT INTO public.products (id, sku, name, category, description, default_selling_price, default_cost_price, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'PRD-MUG-01', 'Custom Ceramic Mug 11oz', 'Drinkware', 'High quality glossy ceramic mug with custom sublimation print', 850.00, 350.00, true),
  ('22222222-2222-2222-2222-222222222222', 'PRD-TSH-01', 'Heavyweight Cotton T-Shirt', 'Apparel', '100% Ring-spun cotton custom DTF printed shirt', 1800.00, 800.00, true),
  ('33333333-3333-3333-3333-333333333333', 'PRD-FRM-01', 'Acrylic Photo Frame 8x10', 'Wall Art', 'Premium clear acrylic frame with high definition glossy print', 2500.00, 1100.00, true),
  ('44444444-4444-4444-4444-444444444444', 'PRD-CNV-01', 'Canvas Wall Print 16x24', 'Wall Art', 'Stretched cotton canvas print on solid wooden pine frame', 4200.00, 1900.00, true),
  ('55555555-5555-5555-5555-555555555555', 'PRD-CAP-01', 'Embroidered Baseball Cap', 'Apparel', 'Custom embroidered structured 6-panel baseball cap', 1200.00, 500.00, true)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED CUSTOMERS
INSERT INTO public.customers (id, customer_code, name, phone, whatsapp, email, address, city, notes)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'CUST-001', 'Ali Khan', '03001234567', '03001234567', 'ali.khan@gmail.com', 'House #12, Street 4, DHA Phase 5', 'Lahore', 'Regular client for apparel prints'),
  ('c2222222-2222-2222-2222-222222222222', 'CUST-002', 'Sara Ahmed', '03219876543', '03219876543', 'sara.ahmed@yahoo.com', 'Flat 402, Al-Latif Tower, F-7/2', 'Islamabad', 'Prefers express courier delivery'),
  ('c3333333-3333-3333-3333-333333333333', 'CUST-003', 'Hamza Malik', '03335557788', '03335557788', 'hamza.malik@outlook.com', 'Plot 88, Block 3, PECHS', 'Karachi', 'Corporate event bulk purchaser'),
  ('c4444444-4444-4444-4444-444444444444', 'CUST-004', 'Usman Tariq', '03124443322', '03124443322', 'usman.tariq@gmail.com', 'House 55, Canal View Colony', 'Lahore', 'Frequent custom gift purchaser')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED EXPENSES
INSERT INTO public.expenses (id, category, description, amount, payment_method, expense_date, notes)
VALUES
  ('e1111111-1111-1111-1111-111111111111', 'raw_material', 'Epson Sublimation Ink Set (CMYK)', 14500.00, 'bank_transfer', NOW() - INTERVAL '3 days', 'Stock refill for print shop'),
  ('e2222222-2222-2222-2222-222222222222', 'packaging', 'Custom Printed Courier Bags (500 pcs)', 8500.00, 'jazzcash', NOW() - INTERVAL '5 days', 'Branded packaging supplier'),
  ('e3333333-3333-3333-3333-333333333333', 'electricity', 'Print Workshop Monthly Electric Bill', 32000.00, 'bank_transfer', NOW() - INTERVAL '10 days', 'LESCO utility bill'),
  ('e4444444-4444-4444-4444-444444444444', 'marketing', 'Meta Facebook & Instagram Ads Campaign', 15000.00, 'card', NOW() - INTERVAL '2 days', 'Order promotion ad spend')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED SAMPLE ORDERS
-- Order 1: ORD-000001 (Ali Khan) - Confirmed
INSERT INTO public.orders (
  id, order_number, customer_id, customer_name, customer_phone, customer_whatsapp, customer_address, customer_city,
  order_date, status, subtotal, discount, delivery_charges, additional_charges, total_amount,
  product_cost, delivery_cost, other_internal_cost, total_cost, profit, total_paid, remaining_amount, cod_amount, payment_status, notes
) VALUES (
  'o1111111-1111-1111-1111-111111111111', 'ORD-000001', 'c1111111-1111-1111-1111-111111111111', 'Ali Khan', '03001234567', '03001234567', 'House #12, Street 4, DHA Phase 5', 'Lahore',
  NOW() - INTERVAL '1 day', 'in_production', 3500.00, 200.00, 250.00, 0.00, 3550.00,
  1500.00, 180.00, 50.00, 1730.00, 1820.00, 1500.00, 2050.00, 2050.00, 'partially_paid', 'Birthday gift order'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (id, order_id, product_id, item_name, description, customization_details, quantity, selling_price, cost_price, selling_total, cost_total)
VALUES 
  ('i1111111-1111-1111-1111-111111111111', 'o1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Custom Ceramic Mug 11oz', 'Magic Mug Color Change', 'Text: Best Dad Ever', 2, 850.00, 350.00, 1700.00, 700.00),
  ('i2222222-2222-2222-2222-222222222222', 'o1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Heavyweight Cotton T-Shirt', 'Black / Size L', 'Front Logo Print', 1, 1800.00, 800.00, 1800.00, 800.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payments (id, order_id, customer_id, amount, payment_type, payment_method, transaction_reference, payment_date, notes)
VALUES (
  'p1111111-1111-1111-1111-111111111111', 'o1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111',
  1500.00, 'advance', 'jazzcash', 'TXN-99882211', NOW() - INTERVAL '1 day', 'Advance received on order confirmation'
) ON CONFLICT (id) DO NOTHING;

-- Order 2: ORD-000002 (Sara Ahmed) - Dispatched
INSERT INTO public.orders (
  id, order_number, customer_id, customer_name, customer_phone, customer_whatsapp, customer_address, customer_city,
  order_date, status, subtotal, discount, delivery_charges, additional_charges, total_amount,
  product_cost, delivery_cost, other_internal_cost, total_cost, profit, total_paid, remaining_amount, cod_amount, payment_status, notes
) VALUES (
  'o2222222-2222-2222-2222-222222222222', 'ORD-000002', 'c2222222-2222-2222-2222-222222222222', 'Sara Ahmed', '03219876543', '03219876543', 'Flat 402, Al-Latif Tower, F-7/2', 'Islamabad',
  NOW() - INTERVAL '2 days', 'dispatched', 4200.00, 0.00, 300.00, 0.00, 4500.00,
  1900.00, 220.00, 0.00, 2120.00, 2380.00, 1000.00, 3500.00, 3500.00, 'partially_paid', 'TCS Tracking #TCS77661122'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (id, order_id, product_id, item_name, description, customization_details, quantity, selling_price, cost_price, selling_total, cost_total)
VALUES (
  'i3333333-3333-3333-3333-333333333333', 'o2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Canvas Wall Print 16x24', 'Custom Wedding Photo Canvas', 'High Gloss Varnish', 1, 4200.00, 1900.00, 4200.00, 1900.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payments (id, order_id, customer_id, amount, payment_type, payment_method, transaction_reference, payment_date, notes)
VALUES (
  'p2222222-2222-2222-2222-222222222222', 'o2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222',
  1000.00, 'advance', 'bank_transfer', 'FT260901882', NOW() - INTERVAL '2 days', 'Advance payment via Meezan Bank'
) ON CONFLICT (id) DO NOTHING;
