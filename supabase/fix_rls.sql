-- ==================================================================
-- NAAM STUDIO - RLS POLICY FIX FOR SUPABASE
-- Run this in Supabase Dashboard -> SQL Editor -> Click RUN
-- ==================================================================

-- 1. Customers Table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to customers" ON public.customers;
DROP POLICY IF EXISTS "Customers viewable by authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Customers manageable by authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Customers updatable by authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Customers soft deletable by admin/manager" ON public.customers;
CREATE POLICY "Allow all access to customers" ON public.customers
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 2. Orders Table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to orders" ON public.orders;
DROP POLICY IF EXISTS "Orders viewable by authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Orders manageable by authenticated users" ON public.orders;
CREATE POLICY "Allow all access to orders" ON public.orders
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. Order Items Table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Order items viewable by authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Order items manageable by authenticated users" ON public.order_items;
CREATE POLICY "Allow all access to order_items" ON public.order_items
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Products Table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to products" ON public.products;
DROP POLICY IF EXISTS "Products viewable by authenticated users" ON public.products;
DROP POLICY IF EXISTS "Products manageable by admin/manager" ON public.products;
CREATE POLICY "Allow all access to products" ON public.products
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 5. Payments Table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to payments" ON public.payments;
DROP POLICY IF EXISTS "Payments viewable by authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Payments manageable by authenticated users" ON public.payments;
CREATE POLICY "Allow all access to payments" ON public.payments
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. Expenses Table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Expenses access limited to admin and manager" ON public.expenses;
CREATE POLICY "Allow all access to expenses" ON public.expenses
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 7. Business Settings Table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to settings" ON public.settings;
CREATE POLICY "Allow all access to settings" ON public.settings
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 8. Profiles Table (Optional)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
        CREATE POLICY "Allow all access to profiles" ON public.profiles
        FOR ALL TO anon, authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;
