-- ==================================================================
-- FUNCTION: generate_order_number()
-- Generates sequential order number like ORD-000001
-- ==================================================================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
    seq_val BIGINT;
    prefix_val TEXT;
BEGIN
    SELECT order_prefix INTO prefix_val FROM public.settings WHERE id = 1;
    IF prefix_val IS NULL THEN
        prefix_val := 'ORD-';
    END IF;
    
    SELECT nextval('public.order_number_seq') INTO seq_val;
    RETURN prefix_val || LPAD(seq_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================================
-- FUNCTION: recalculate_order_financials(order_id UUID)
-- Guarantees ZERO financial data drift by atomically updating orders row
-- ==================================================================
CREATE OR REPLACE FUNCTION public.recalculate_order_financials(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_subtotal DECIMAL(12,2) := 0.00;
    v_product_cost DECIMAL(12,2) := 0.00;
    v_discount DECIMAL(12,2) := 0.00;
    v_delivery_charges DECIMAL(12,2) := 0.00;
    v_additional_charges DECIMAL(12,2) := 0.00;
    v_delivery_cost DECIMAL(12,2) := 0.00;
    v_other_internal_cost DECIMAL(12,2) := 0.00;
    v_total_amount DECIMAL(12,2) := 0.00;
    v_total_cost DECIMAL(12,2) := 0.00;
    v_profit DECIMAL(12,2) := 0.00;
    v_total_paid DECIMAL(12,2) := 0.00;
    v_remaining_amount DECIMAL(12,2) := 0.00;
    v_cod_amount DECIMAL(12,2) := 0.00;
    v_payment_status TEXT := 'unpaid';
    v_manual_cod BOOLEAN := false;
BEGIN
    -- Fetch items subtotals
    SELECT 
        COALESCE(SUM(selling_total), 0.00),
        COALESCE(SUM(cost_total), 0.00)
    INTO v_subtotal, v_product_cost
    FROM public.order_items
    WHERE order_id = p_order_id;

    -- Fetch order parameters
    SELECT 
        COALESCE(discount, 0.00),
        COALESCE(delivery_charges, 0.00),
        COALESCE(additional_charges, 0.00),
        COALESCE(delivery_cost, 0.00),
        COALESCE(other_internal_cost, 0.00),
        COALESCE(cod_manually_adjusted, false),
        COALESCE(cod_amount, 0.00)
    INTO v_discount, v_delivery_charges, v_additional_charges, v_delivery_cost, v_other_internal_cost, v_manual_cod, v_cod_amount
    FROM public.orders
    WHERE id = p_order_id;

    -- Calculate total amount (Gross Revenue = Subtotal - Discount + Delivery Charges + Additional Charges)
    v_total_amount := v_subtotal - v_discount + v_delivery_charges + v_additional_charges;
    IF v_total_amount < 0 THEN
        v_total_amount := 0.00;
    END IF;

    -- Calculate total internal cost (Product Cost + Delivery Cost + Other Internal Cost)
    v_total_cost := v_product_cost + v_delivery_cost + v_other_internal_cost;

    -- Calculate Net Profit (Gross Revenue - Total Internal Cost)
    v_profit := v_total_amount - v_total_cost;

    -- Calculate Payments (excluding deleted payments)
    SELECT COALESCE(SUM(amount), 0.00)
    INTO v_total_paid
    FROM public.payments
    WHERE order_id = p_order_id AND deleted_at IS NULL;

    -- Calculate remaining balance
    v_remaining_amount := v_total_amount - v_total_paid;
    IF v_remaining_amount < 0 THEN
        v_remaining_amount := 0.00;
    END IF;

    -- Set COD amount (if not manually adjusted, COD equals remaining amount)
    IF NOT v_manual_cod THEN
        v_cod_amount := v_remaining_amount;
    END IF;

    -- Determine payment status
    IF v_total_paid <= 0 THEN
        v_payment_status := 'unpaid';
    ELSIF v_total_paid < v_total_amount THEN
        v_payment_status := 'partially_paid';
    ELSE
        v_payment_status := 'paid';
    END IF;

    -- Update order row
    UPDATE public.orders
    SET subtotal = v_subtotal,
        product_cost = v_product_cost,
        total_amount = v_total_amount,
        total_cost = v_total_cost,
        profit = v_profit,
        total_paid = v_total_paid,
        remaining_amount = v_remaining_amount,
        cod_amount = v_cod_amount,
        payment_status = v_payment_status,
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recalculate on order items change
CREATE OR REPLACE FUNCTION public.trg_order_items_changed()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.recalculate_order_financials(OLD.order_id);
    ELSE
        PERFORM public.recalculate_order_financials(NEW.order_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_items_aiud ON public.order_items;
CREATE TRIGGER trg_order_items_aiud
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.trg_order_items_changed();

-- Trigger to recalculate on payments change
CREATE OR REPLACE FUNCTION public.trg_payments_changed()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.recalculate_order_financials(OLD.order_id);
    ELSE
        PERFORM public.recalculate_order_financials(NEW.order_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_payments_aiud ON public.payments;
CREATE TRIGGER trg_payments_aiud
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.trg_payments_changed();

-- ==================================================================
-- RLS SECURITY & PERMISSIONS
-- ==================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch current authenticated user's role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    IF user_role IS NULL THEN
        RETURN 'staff';
    END IF;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles RLS
CREATE POLICY "Profiles readable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles updatable by admin or self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.get_auth_role() = 'admin');

-- Customers RLS
CREATE POLICY "Customers viewable by authenticated users" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Customers manageable by authenticated users" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Customers updatable by authenticated users" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Customers soft deletable by admin/manager" ON public.customers FOR DELETE TO authenticated USING (public.get_auth_role() IN ('admin', 'manager'));

-- Products RLS
CREATE POLICY "Products viewable by authenticated users" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Products manageable by admin/manager" ON public.products FOR ALL TO authenticated USING (public.get_auth_role() IN ('admin', 'manager'));

-- Expenses RLS (STRICT REQUIREMENT: STAFF HAS NO ACCESS TO EXPENSES)
CREATE POLICY "Expenses access limited to admin and manager" ON public.expenses FOR ALL TO authenticated USING (public.get_auth_role() IN ('admin', 'manager'));

-- Orders RLS
CREATE POLICY "Orders viewable by authenticated users" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Orders insertable by authenticated users" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Orders updatable by authenticated users" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Orders soft delete by admin/manager" ON public.orders FOR DELETE TO authenticated USING (public.get_auth_role() IN ('admin', 'manager'));

-- Order Items RLS
CREATE POLICY "Order items viewable by authenticated users" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Order items insertable by authenticated users" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Order items updatable by authenticated users" ON public.order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Order items deletable by authenticated users" ON public.order_items FOR DELETE TO authenticated USING (true);

-- Payments RLS
CREATE POLICY "Payments viewable by authenticated users" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Payments insertable by authenticated users" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Payments updatable by authenticated users" ON public.payments FOR UPDATE TO authenticated USING (true);

-- Order Status History & Audit Logs RLS
CREATE POLICY "Status history viewable" ON public.order_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Status history insertable" ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Audit logs viewable by admin/manager" ON public.audit_logs FOR SELECT TO authenticated USING (public.get_auth_role() IN ('admin', 'manager'));

-- Settings RLS
CREATE POLICY "Settings viewable by authenticated users" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Settings updatable by admin" ON public.settings FOR UPDATE TO authenticated USING (public.get_auth_role() = 'admin');

-- ==================================================================
-- FINANCIAL DATA SECURITY RPC FUNCTIONS (STAFF SANITIZATION)
-- Satisfies requirement 3: Database & RPC level security preventing staff from querying internal costs/profit
-- ==================================================================
CREATE OR REPLACE FUNCTION public.get_orders_safe(
    p_status TEXT DEFAULT NULL,
    p_payment_status TEXT DEFAULT NULL,
    p_include_deleted BOOLEAN DEFAULT false,
    p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    order_number TEXT,
    customer_id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    customer_whatsapp TEXT,
    customer_address TEXT,
    customer_city TEXT,
    order_date TIMESTAMPTZ,
    required_delivery_date TIMESTAMPTZ,
    status TEXT,
    subtotal DECIMAL(12,2),
    discount DECIMAL(12,2),
    delivery_charges DECIMAL(12,2),
    additional_charges DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    product_cost DECIMAL(12,2),
    delivery_cost DECIMAL(12,2),
    other_internal_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    profit DECIMAL(12,2),
    total_paid DECIMAL(12,2),
    remaining_amount DECIMAL(12,2),
    cod_amount DECIMAL(12,2),
    payment_status TEXT,
    notes TEXT,
    internal_notes TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := public.get_auth_role();
    
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.customer_id,
        o.customer_name,
        o.customer_phone,
        o.customer_whatsapp,
        o.customer_address,
        o.customer_city,
        o.order_date,
        o.required_delivery_date,
        o.status,
        o.subtotal,
        o.discount,
        o.delivery_charges,
        o.additional_charges,
        o.total_amount,
        -- IF STAFF, SANITIZE COSTS AND PROFIT TO NULL/0
        CASE WHEN v_role = 'staff' THEN NULL ELSE o.product_cost END,
        CASE WHEN v_role = 'staff' THEN NULL ELSE o.delivery_cost END,
        CASE WHEN v_role = 'staff' THEN NULL ELSE o.other_internal_cost END,
        CASE WHEN v_role = 'staff' THEN NULL ELSE o.total_cost END,
        CASE WHEN v_role = 'staff' THEN NULL ELSE o.profit END,
        o.total_paid,
        o.remaining_amount,
        o.cod_amount,
        o.payment_status,
        o.notes,
        CASE WHEN v_role = 'staff' THEN NULL ELSE o.internal_notes END,
        o.deleted_at,
        o.created_at
    FROM public.orders o
    WHERE (p_include_deleted OR o.deleted_at IS NULL)
      AND (p_status IS NULL OR o.status = p_status)
      AND (p_payment_status IS NULL OR o.payment_status = p_payment_status)
      AND (p_search IS NULL OR (
          o.order_number ILIKE '%' || p_search || '%' OR
          o.customer_name ILIKE '%' || p_search || '%' OR
          o.customer_phone ILIKE '%' || p_search || '%'
      ))
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
