import { createClient } from '../supabase/client';
import {
  Order,
  Customer,
  Product,
  Payment,
  Expense,
  BusinessSettings,
  UserRole,
} from '../types';

export class DataService {
  // ----------------------------------------------------------------
  // SETTINGS MANAGEMENT (SUPABASE DB)
  // ----------------------------------------------------------------
  static async getSettings(): Promise<BusinessSettings> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (data && !error) {
        return data as BusinessSettings;
      }
    } catch (e) {
      // Fallback default settings if table initializing
    }
    return {
      id: 1,
      business_name: 'NAAM Studio',
      logo_url: '/images/logo.png',
      phone: '0300-1234567',
      whatsapp: '0300-1234567',
      email: 'info@naamstudio.com',
      address: 'Main Boulevard, Gulberg III, Lahore',
      currency: 'PKR',
      currency_symbol: 'Rs.',
      timezone: 'Asia/Karachi',
      order_prefix: 'ORD-',
      default_delivery_charge: 250,
      updated_at: new Date().toISOString(),
    };
  }

  static async updateSettings(newSettings: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const supabase = createClient();
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('settings').upsert(updated).select().single();
    if (error) {
      console.error('Supabase update settings error:', error);
      throw new Error(`Failed to update settings: ${error.message}`);
    }
    return data as BusinessSettings;
  }

  // ----------------------------------------------------------------
  // ORDERS MANAGEMENT (SUPABASE DB)
  // ----------------------------------------------------------------
  static async getOrders(role: UserRole = 'admin', options?: { includeDeleted?: boolean }): Promise<Order[]> {
    const supabase = createClient();
    let query = supabase
      .from('orders')
      .select('*, order_items(*), payments(*)');

    if (!options?.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch orders error:', error);
      throw new Error('Unable to load orders. Please check your connection or try again.');
    }

    const orders = (data || []) as Order[];

    // STAFF PRIVACY SANITIZATION
    if (role === 'staff') {
      return orders.map((order) => ({
        ...order,
        product_cost: 0,
        delivery_cost: 0,
        other_internal_cost: 0,
        total_cost: 0,
        profit: 0,
        internal_notes: undefined,
        order_items: order.order_items?.map((item) => ({
          ...item,
          cost_price: 0,
          cost_total: 0,
        })),
      }));
    }

    return orders;
  }

  static async getOrderById(id: string, role: UserRole = 'admin'): Promise<Order | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), payments(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    let order = data as Order;

    if (role === 'staff') {
      order = {
        ...order,
        product_cost: 0,
        delivery_cost: 0,
        other_internal_cost: 0,
        total_cost: 0,
        profit: 0,
        internal_notes: undefined,
        order_items: order.order_items?.map((item) => ({
          ...item,
          cost_price: 0,
          cost_total: 0,
        })),
      };
    }

    return order;
  }

  static async getTrashOrders(role: UserRole = 'admin'): Promise<Order[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), payments(*)')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch trash orders error:', error);
      throw new Error('Unable to load deleted orders.');
    }

    const orders = (data || []) as Order[];

    if (role === 'staff') {
      return orders.map((order) => ({
        ...order,
        product_cost: 0,
        delivery_cost: 0,
        other_internal_cost: 0,
        total_cost: 0,
        profit: 0,
        internal_notes: undefined,
      }));
    }

    return orders;
  }

  static async createOrder(orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Promise<Order> {
    const supabase = createClient();

    // 1. Generate Order Number
    const { data: countData } = await supabase.from('orders').select('id');
    const orderNum = `ORD-${String((countData?.length || 0) + 1).padStart(6, '0')}`;

    // 2. Insert Order Header
    const { data: insertedOrder, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNum,
        customer_id: orderData.customer_id,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_whatsapp: orderData.customer_whatsapp,
        customer_address: orderData.customer_address,
        customer_city: orderData.customer_city || 'Gujrat',
        order_date: orderData.order_date || new Date().toISOString(),
        required_delivery_date: orderData.required_delivery_date,
        status: orderData.status || 'new',
        subtotal: orderData.subtotal || 0,
        discount: orderData.discount || 0,
        delivery_charges: orderData.delivery_charges || 0,
        additional_charges: orderData.additional_charges || 0,
        total_amount: orderData.total_amount || 0,
        product_cost: orderData.product_cost || 0,
        delivery_cost: orderData.delivery_cost || 0,
        other_internal_cost: orderData.other_internal_cost || 0,
        total_cost: orderData.total_cost || 0,
        profit: orderData.profit || 0,
        total_paid: orderData.total_paid || 0,
        remaining_amount: orderData.remaining_amount || 0,
        cod_amount: orderData.cod_amount || 0,
        payment_status: orderData.payment_status || 'unpaid',
        notes: orderData.notes,
        internal_notes: orderData.internal_notes,
      })
      .select()
      .single();

    if (orderErr || !insertedOrder) {
      console.error('Supabase create order error:', orderErr);
      throw new Error(`Failed to create order in database: ${orderErr?.message || 'Insert failed'}`);
    }

    const orderId = insertedOrder.id;

    // 3. Insert Items
    if (orderData.order_items && orderData.order_items.length > 0) {
      const itemsToInsert = orderData.order_items.map((item) => ({
        order_id: orderId,
        product_id: item.product_id,
        item_name: item.item_name,
        description: item.description,
        customization_details: item.customization_details,
        quantity: item.quantity,
        selling_price: item.selling_price,
        cost_price: item.cost_price || 0,
        selling_total: item.selling_total,
        cost_total: item.cost_total || 0,
      }));

      await supabase.from('order_items').insert(itemsToInsert);
    }

    // 4. Insert Initial Payment if provided
    if (orderData.payments && orderData.payments.length > 0) {
      const paymentsToInsert = orderData.payments.map((p) => ({
        order_id: orderId,
        customer_id: orderData.customer_id,
        amount: p.amount,
        payment_type: p.payment_type || 'advance',
        payment_method: p.payment_method || 'cash',
        transaction_reference: p.transaction_reference,
        payment_date: p.payment_date || new Date().toISOString(),
        notes: p.notes,
      }));

      await supabase.from('payments').insert(paymentsToInsert);
    }

    return (await this.getOrderById(orderId))!;
  }

  static async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const supabase = createClient();
    const { order_items, payments, ...orderUpdates } = updates;

    const { error } = await supabase
      .from('orders')
      .update({
        ...orderUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase update order error:', error);
      throw new Error(`Failed to update order in database: ${error.message}`);
    }

    return (await this.getOrderById(id))!;
  }

  static async duplicateOrder(id: string): Promise<Order> {
    const original = await this.getOrderById(id, 'admin');
    if (!original) throw new Error('Original order not found');

    return await this.createOrder({
      customer_id: original.customer_id,
      customer_name: original.customer_name,
      customer_phone: original.customer_phone,
      customer_whatsapp: original.customer_whatsapp,
      customer_address: original.customer_address,
      customer_city: original.customer_city,
      status: 'new',
      discount: original.discount,
      delivery_charges: original.delivery_charges,
      additional_charges: original.additional_charges,
      delivery_cost: original.delivery_cost,
      other_internal_cost: original.other_internal_cost,
      notes: original.notes,
      internal_notes: original.internal_notes,
      order_items: original.order_items?.map((item) => ({ ...item, id: undefined, order_id: undefined })),
    } as any);
  }

  static async softDeleteOrder(id: string, deletedBy?: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || 'Admin',
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase soft delete error:', error);
      throw new Error(`Failed to delete order in database: ${error.message}`);
    }
  }

  static async restoreOrder(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .update({
        deleted_at: null,
        deleted_by: null,
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase restore order error:', error);
      throw new Error(`Failed to restore order in database: ${error.message}`);
    }
  }

  static async permanentDeleteOrder(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('orders').delete().eq('id', id);

    if (error) {
      console.error('Supabase permanent delete error:', error);
      throw new Error(`Failed to permanently delete order in database: ${error.message}`);
    }
  }

  // ----------------------------------------------------------------
  // CUSTOMERS MANAGEMENT (SUPABASE DB)
  // ----------------------------------------------------------------
  static async getCustomers(): Promise<Customer[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch customers error:', error);
      throw new Error('Unable to load customers. Please check your connection.');
    }

    return (data || []) as Customer[];
  }

  static async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const supabase = createClient();
    const { data: countData } = await supabase.from('customers').select('id');
    const custCode = `CUST-${String((countData?.length || 0) + 1).padStart(3, '0')}`;

    const { data, error } = await supabase
      .from('customers')
      .insert({
        customer_code: custCode,
        name: customer.name,
        phone: customer.phone,
        whatsapp: customer.whatsapp,
        email: customer.email,
        address: customer.address,
        city: customer.city || 'Gujrat',
        notes: customer.notes,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase create customer error:', error);
      throw new Error(`Failed to create customer in database: ${error?.message || 'Database insert failed'}`);
    }

    return data as Customer;
  }

  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase update customer error:', error);
      throw new Error(`Failed to update customer in database: ${error?.message || 'Database update failed'}`);
    }

    return data as Customer;
  }

  static async deleteCustomer(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Supabase delete customer error:', error);
      throw new Error(`Failed to delete customer in database: ${error.message}`);
    }
  }

  // ----------------------------------------------------------------
  // PRODUCTS MANAGEMENT (SUPABASE DB)
  // ----------------------------------------------------------------
  static async getProducts(): Promise<Product[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch products error:', error);
      throw new Error('Unable to load products.');
    }

    return (data || []) as Product[];
  }

  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .insert({
        sku: product.sku,
        name: product.name,
        category: product.category || 'General',
        description: product.description,
        default_selling_price: product.default_selling_price,
        default_cost_price: product.default_cost_price,
        is_active: product.is_active ?? true,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase create product error:', error);
      throw new Error(`Failed to create product in database: ${error?.message || 'Database insert failed'}`);
    }

    return data as Product;
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase update product error:', error);
      throw new Error(`Failed to update product in database: ${error?.message || 'Database update failed'}`);
    }

    return data as Product;
  }

  static async deleteProduct(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Supabase delete product error:', error);
      throw new Error(`Failed to delete product in database: ${error.message}`);
    }
  }

  // ----------------------------------------------------------------
  // PAYMENTS MANAGEMENT (SUPABASE DB)
  // ----------------------------------------------------------------
  static async getPayments(): Promise<Payment[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Supabase fetch payments error:', error);
      throw new Error('Unable to load payments.');
    }

    return (data || []) as Payment[];
  }

  static async addPayment(
    orderId: string,
    payment: {
      amount: number;
      payment_type: any;
      payment_method: any;
      transaction_reference?: string;
      notes?: string;
    }
  ): Promise<Order> {
    const supabase = createClient();
    const order = await this.getOrderById(orderId, 'admin');
    if (!order) throw new Error('Order not found');

    const { error: payErr } = await supabase.from('payments').insert({
      order_id: orderId,
      customer_id: order.customer_id,
      amount: payment.amount,
      payment_type: payment.payment_type,
      payment_method: payment.payment_method,
      transaction_reference: payment.transaction_reference,
      notes: payment.notes,
      payment_date: new Date().toISOString(),
    });

    if (payErr) {
      console.error('Supabase add payment error:', payErr);
      throw new Error(`Failed to add payment in database: ${payErr.message}`);
    }

    const newTotalPaid = (order.total_paid || 0) + payment.amount;
    const newRemaining = Math.max(0, order.total_amount - newTotalPaid);
    const newStatus = newRemaining === 0 ? 'paid' : newTotalPaid > 0 ? 'partially_paid' : 'unpaid';

    await supabase
      .from('orders')
      .update({
        total_paid: newTotalPaid,
        remaining_amount: newRemaining,
        cod_amount: order.cod_manually_adjusted ? order.cod_amount : newRemaining,
        payment_status: newStatus,
      })
      .eq('id', orderId);

    return (await this.getOrderById(orderId))!;
  }

  static async deletePayment(orderId: string, paymentId: string): Promise<Order> {
    const supabase = createClient();
    const { error } = await supabase.from('payments').delete().eq('id', paymentId);
    if (error) {
      console.error('Supabase delete payment error:', error);
      throw new Error(`Failed to delete payment in database: ${error.message}`);
    }

    return (await this.getOrderById(orderId))!;
  }

  // ----------------------------------------------------------------
  // EXPENSES MANAGEMENT (SUPABASE DB - ADMIN/MANAGER ONLY)
  // ----------------------------------------------------------------
  static async getExpenses(role: UserRole = 'admin'): Promise<Expense[]> {
    if (role === 'staff') {
      return []; // STAFF IS BLOCKED FROM EXPENSES
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .is('deleted_at', null)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Supabase fetch expenses error:', error);
      throw new Error('Unable to load expenses.');
    }

    return (data || []) as Expense[];
  }

  static async createExpense(
    expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>,
    role: UserRole = 'admin'
  ): Promise<Expense> {
    if (role === 'staff') throw new Error('Unauthorized');

    const supabase = createClient();
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        payment_method: expense.payment_method,
        expense_date: expense.expense_date || new Date().toISOString(),
        notes: expense.notes,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase create expense error:', error);
      throw new Error(`Failed to create expense in database: ${error?.message || 'Database insert failed'}`);
    }

    return data as Expense;
  }

  static async deleteExpense(id: string, role: UserRole = 'admin'): Promise<void> {
    if (role === 'staff') throw new Error('Unauthorized');

    const supabase = createClient();
    const { error } = await supabase
      .from('expenses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Supabase delete expense error:', error);
      throw new Error(`Failed to delete expense in database: ${error.message}`);
    }
  }
}
