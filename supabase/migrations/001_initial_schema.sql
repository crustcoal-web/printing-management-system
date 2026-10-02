-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================================================================
-- 1. PROFILES TABLE
-- ==================================================================
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

-- ==================================================================
-- 2. CUSTOMERS TABLE
-- ==================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Lahore',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON public.customers(deleted_at);

-- ==================================================================
-- 3. PRODUCTS TABLE
-- ==================================================================
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

-- ==================================================================
-- 4. ORDERS SEQUENCE FOR HUMAN READABLE ORDER NUMBER (ORD-000001)
-- ==================================================================
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1 INCREMENT BY 1;

-- ==================================================================
-- 5. ORDERS TABLE
-- ==================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_whatsapp TEXT,
    customer_address TEXT NOT NULL,
    customer_city TEXT NOT NULL DEFAULT 'Lahore',
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    required_delivery_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'in_production', 'ready', 'dispatched', 'delivered', 'completed', 'on_hold', 'cancelled', 'returned')),
    
    -- Revenue calculation fields
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    delivery_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    additional_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Internal cost fields
    product_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    delivery_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    other_internal_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    profit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Payment state fields
    total_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    remaining_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cod_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cod_manually_adjusted BOOLEAN NOT NULL DEFAULT false,
    cod_adjustment_reason TEXT,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'refunded')),
    
    -- Notes & Auditing
    notes TEXT,
    internal_notes TEXT,
    assigned_to UUID REFERENCES public.profiles(id),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON public.orders(deleted_at);

-- ==================================================================
-- 6. ORDER ITEMS TABLE (PRODUCT SNAPSHOT)
-- ==================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    customization_details TEXT,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    selling_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cost_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ==================================================================
-- 7. PAYMENTS TABLE
-- ==================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount <> 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('advance', 'partial', 'final', 'cod', 'refund')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'card', 'cod', 'other')),
    transaction_reference TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- ==================================================================
-- 8. EXPENSES TABLE
-- ==================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('printing', 'raw_material', 'packaging', 'delivery', 'electricity', 'salary', 'marketing', 'maintenance', 'other')),
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'cash',
    expense_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);

-- ==================================================================
-- 9. ORDER STATUS HISTORY TABLE
-- ==================================================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_status_history_order_id ON public.order_status_history(order_id);

-- ==================================================================
-- 10. AUDIT LOGS TABLE
-- ==================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================================
-- 11. SETTINGS TABLE
-- ==================================================================
CREATE TABLE IF NOT EXISTS public.settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    business_name TEXT NOT NULL DEFAULT 'NAAM Studio',
    logo_url TEXT DEFAULT '/images/logo.png',
    phone TEXT NOT NULL DEFAULT '0300-1234567',
    whatsapp TEXT NOT NULL DEFAULT '0300-1234567',
    email TEXT NOT NULL DEFAULT 'info@naamstudio.com',
    address TEXT NOT NULL DEFAULT 'Main Boulevard, Gulberg III, Lahore',
    currency TEXT NOT NULL DEFAULT 'PKR',
    currency_symbol TEXT NOT NULL DEFAULT 'Rs.',
    timezone TEXT NOT NULL DEFAULT 'Asia/Karachi',
    order_prefix TEXT NOT NULL DEFAULT 'ORD-',
    default_delivery_charge DECIMAL(12,2) NOT NULL DEFAULT 250.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings row if not exists
INSERT INTO public.settings (id, business_name, logo_url, phone, whatsapp, email, address, currency, currency_symbol, timezone, order_prefix, default_delivery_charge)
VALUES (1, 'NAAM Studio', '/images/logo.png', '0300-1234567', '0300-1234567', 'info@naamstudio.com', 'Main Boulevard, Gulberg III, Lahore', 'PKR', 'Rs.', 'Asia/Karachi', 'ORD-', 250.00)
ON CONFLICT (id) DO NOTHING;
