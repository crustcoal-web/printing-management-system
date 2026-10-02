-- ==================================================================
-- NAAM STUDIO - COMPLETE DATABASE SCHEMA & INITIALIZATION SCRIPT
-- Copy and Paste this ENTIRE file into Supabase SQL Editor and click RUN
-- ==================================================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Gujrat',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON public.customers(deleted_at);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    description TEXT,
    default_selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    default_cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- 4. ORDERS SEQUENCE
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1 INCREMENT BY 1;

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_whatsapp TEXT,
    customer_address TEXT NOT NULL,
    customer_city TEXT NOT NULL DEFAULT 'Gujrat',
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    required_delivery_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'in_production', 'ready', 'dispatched', 'delivered', 'completed', 'on_hold', 'cancelled', 'returned')),
    
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    delivery_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    additional_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    product_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    delivery_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    other_internal_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    profit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    total_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    remaining_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cod_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cod_manually_adjusted BOOLEAN NOT NULL DEFAULT false,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'refunded')),
    
    notes TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON public.orders(deleted_at);

-- 6. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    customization_details TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    selling_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cost_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 7. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_type TEXT NOT NULL DEFAULT 'advance' CHECK (payment_type IN ('advance', 'partial', 'remaining', 'full', 'refund')),
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'card', 'cheque', 'other')),
    transaction_reference TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- 8. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('raw_material', 'rent', 'electricity', 'salaries', 'marketing', 'maintenance', 'packaging', 'transportation', 'other')),
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'card', 'cheque', 'other')),
    expense_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);

-- 9. BUSINESS SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    business_name TEXT NOT NULL DEFAULT 'NAAM Studio',
    logo_url TEXT DEFAULT '/images/logo.png',
    phone TEXT DEFAULT '0300-1234567',
    whatsapp TEXT DEFAULT '0300-1234567',
    email TEXT DEFAULT 'info@naamstudio.com',
    address TEXT DEFAULT 'Main Boulevard, Gulberg III, Lahore',
    currency TEXT DEFAULT 'PKR',
    currency_symbol TEXT DEFAULT 'Rs.',
    timezone TEXT DEFAULT 'Asia/Karachi',
    order_prefix TEXT DEFAULT 'ORD-',
    default_delivery_charge DECIMAL(12,2) DEFAULT 250.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.settings (id, business_name, logo_url, phone, whatsapp, email, address, currency, currency_symbol, order_prefix, default_delivery_charge)
VALUES (1, 'NAAM Studio', '/images/logo.png', '0300-1234567', '0300-1234567', 'info@naamstudio.com', 'Main Boulevard, Gulberg III, Lahore', 'PKR', 'Rs.', 'ORD-', 250.00)
ON CONFLICT (id) DO UPDATE SET business_name = 'NAAM Studio';

-- SEED INITIAL GUJRAT CUSTOMERS
INSERT INTO public.customers (id, customer_code, name, phone, whatsapp, email, address, city, notes)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'CUST-001', 'Mian Gujrat Custom Prints', '03006241122', '03006241122', 'mian.gujrat@gmail.com', 'Shop #14, Court Road, Near Fawara Chowk', 'Gujrat', 'Regular Gujrat apparel & mug customer'),
  ('c2222222-2222-2222-2222-222222222222', 'CUST-002', 'Shaheen Printers Gujrat', '03217482910', '03217482910', 'shaheen.gujrat@yahoo.com', 'Circular Road, Near Old Bus Stand', 'Gujrat', 'Bulk printing order client in Gujrat'),
  ('c3333333-3333-3333-3333-333333333333', 'CUST-003', 'Chaudhry & Sons Gujrat', '03338889911', '03338889911', 'chaudhry.gujrat@outlook.com', 'Main GT Road, Near Service Mor', 'Gujrat', 'Corporate gift purchaser - Gujrat branch'),
  ('c4444444-4444-4444-4444-444444444444', 'CUST-004', 'Al-Rehman Traders Gujrat', '03125556677', '03125556677', 'alrehman.gujrat@gmail.com', 'Bhimber Road, Opp. University of Gujrat City Campus', 'Gujrat', 'Event signage & merchandise client')
ON CONFLICT (id) DO NOTHING;
