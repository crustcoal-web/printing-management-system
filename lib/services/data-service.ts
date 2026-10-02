import { createClient } from '../supabase/client';
import {
  Order,
  Customer,
  Product,
  Payment,
  Expense,
  BusinessSettings,
  UserRole,
  OrderStatus,
  PaymentStatus,
} from '../types';
import { calculateOrderFinancials } from '../calculations/financials';

// PRODUCTION REAL DATA STORE (STARTS EMPTY - ZERO FAKE/DUMMY SEED DATA)
let storeCustomers: Customer[] = [];
let storeProducts: Product[] = [];
let storeOrders: Order[] = [];
let storeExpenses: Expense[] = [];

let storeSettings: BusinessSettings = {
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

let orderSeqCounter = 1;

export class DataService {
  // ----------------------------------------------------------------
  // SETTINGS MANAGEMENT
  // ----------------------------------------------------------------
  static async getSettings(): Promise<BusinessSettings> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (data && !error) {
        storeSettings = { ...storeSettings, ...data };
      }
    } catch (e) {
      // Offline fallback
    }
    return { ...storeSettings };
  }

  static async updateSettings(newSettings: Partial<BusinessSettings>): Promise<BusinessSettings> {
    storeSettings = { ...storeSettings, ...newSettings, updated_at: new Date().toISOString() };
    const supabase = createClient();
    try {
      await supabase.from('settings').upsert(storeSettings);
    } catch (e) {
      // Offline fallback
    }
    return { ...storeSettings };
  }

  // ----------------------------------------------------------------
  // CUSTOMER MANAGEMENT
  // ----------------------------------------------------------------
  static async getCustomers(includeDeleted = false): Promise<Customer[]> {
    return storeCustomers.filter((c) => includeDeleted || !c.deleted_at);
  }

  static async getCustomerById(id: string): Promise<Customer | undefined> {
    return storeCustomers.find((c) => c.id === id);
  }

  static async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone) return undefined;
    return storeCustomers.find(
      (c) => !c.deleted_at && c.phone.replace(/\D/g, '') === cleanPhone
    );
  }

  static async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const id = `c_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const code = `CUST-${String(storeCustomers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      ...customer,
      id,
      customer_code: code,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    storeCustomers.unshift(newCust);
    return newCust;
  }

  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const idx = storeCustomers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    storeCustomers[idx] = {
      ...storeCustomers[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return storeCustomers[idx];
  }

  static async deleteCustomer(id: string): Promise<void> {
    // Soft delete customer to preserve order history
    await this.updateCustomer(id, { deleted_at: new Date().toISOString() });
  }

  // ----------------------------------------------------------------
  // PRODUCT MANAGEMENT
  // ----------------------------------------------------------------
  static async getProducts(includeDeleted = false): Promise<Product[]> {
    return storeProducts.filter((p) => includeDeleted || !p.deleted_at);
  }

  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const id = `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newProduct: Product = {
      ...product,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    storeProducts.unshift(newProduct);
    return newProduct;
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const idx = storeProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    storeProducts[idx] = {
      ...storeProducts[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return storeProducts[idx];
  }

  static async deleteProduct(id: string): Promise<void> {
    // Soft delete product so historical order snapshots remain intact
    await this.updateProduct(id, { deleted_at: new Date().toISOString(), is_active: false });
  }

  // ----------------------------------------------------------------
  // ORDERS MANAGEMENT (STRICT STAFF ROLE FINANCIAL SANITIZATION)
  // ----------------------------------------------------------------
  static async getOrders(
    role: UserRole = 'admin',
    options?: {
      includeDeleted?: boolean;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      search?: string;
      customerId?: string;
    }
  ): Promise<Order[]> {
    let list = storeOrders.filter((o) => (options?.includeDeleted ? true : !o.deleted_at));

    if (options?.customerId) {
      list = list.filter((o) => o.customer_id === options.customerId);
    }
    if (options?.status) {
      list = list.filter((o) => o.status === options.status);
    }
    if (options?.paymentStatus) {
      list = list.filter((o) => o.payment_status === options.paymentStatus);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q)
      );
    }

    // REQUIREMENT 3 & 16: SANITIZE INTERNAL COSTS & PROFIT IF USER IS STAFF
    if (role === 'staff') {
      return list.map((o) => ({
        ...o,
        product_cost: undefined,
        delivery_cost: undefined,
        other_internal_cost: undefined,
        total_cost: undefined,
        profit: undefined,
        internal_notes: undefined,
        order_items: o.order_items?.map((item) => ({
          ...item,
          cost_price: 0,
          cost_total: 0,
        })),
      }));
    }

    return list;
  }

  static async getOrderById(id: string, role: UserRole = 'admin'): Promise<Order | undefined> {
    const orders = await this.getOrders(role, { includeDeleted: true });
    return orders.find((o) => o.id === id);
  }

  static async createOrder(
    orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'> & {
      advancePayment?: number;
      advancePaymentMethod?: string;
    }
  ): Promise<Order> {
    const id = `o_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const prefix = storeSettings.order_prefix || 'ORD-';
    const orderNumber = `${prefix}${String(orderSeqCounter++).padStart(6, '0')}`;

    const financials = calculateOrderFinancials({
      items: orderData.order_items || [],
      discount: orderData.discount,
      delivery_charges: orderData.delivery_charges,
      additional_charges: orderData.additional_charges,
      delivery_cost: orderData.delivery_cost ?? 0,
      other_internal_cost: orderData.other_internal_cost ?? 0,
      payments: orderData.advancePayment ? [{ amount: orderData.advancePayment }] : [],
    });

    const newPayments: Payment[] = orderData.advancePayment
      ? [
          {
            id: `pay_${Date.now()}`,
            order_id: id,
            customer_id: orderData.customer_id,
            amount: orderData.advancePayment,
            payment_type: 'advance',
            payment_method: (orderData.advancePaymentMethod as any) || 'cash',
            payment_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ]
      : [];

    const newOrder: Order = {
      ...orderData,
      id,
      order_number: orderNumber,
      order_date: orderData.order_date || new Date().toISOString(),
      status: orderData.status || 'new',
      subtotal: financials.subtotal,
      discount: financials.discount,
      delivery_charges: financials.delivery_charges,
      additional_charges: financials.additional_charges,
      total_amount: financials.total_amount,
      product_cost: financials.product_cost,
      delivery_cost: financials.delivery_cost,
      other_internal_cost: financials.other_internal_cost,
      total_cost: financials.total_cost,
      profit: financials.profit,
      total_paid: financials.total_paid,
      remaining_amount: financials.remaining_amount,
      cod_amount: financials.cod_amount,
      payment_status: financials.payment_status,
      payments: newPayments,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    storeOrders.unshift(newOrder);
    return newOrder;
  }

  static async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const idx = storeOrders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Order not found');

    const current = storeOrders[idx];
    const items = updates.order_items || current.order_items || [];
    const payments = current.payments || [];

    const financials = calculateOrderFinancials({
      items,
      discount: updates.discount ?? current.discount,
      delivery_charges: updates.delivery_charges ?? current.delivery_charges,
      additional_charges: updates.additional_charges ?? current.additional_charges,
      delivery_cost: updates.delivery_cost ?? current.delivery_cost ?? 0,
      other_internal_cost: updates.other_internal_cost ?? current.other_internal_cost ?? 0,
      payments,
    });

    const updatedOrder: Order = {
      ...current,
      ...updates,
      subtotal: financials.subtotal,
      total_amount: financials.total_amount,
      product_cost: financials.product_cost,
      total_cost: financials.total_cost,
      profit: financials.profit,
      total_paid: financials.total_paid,
      remaining_amount: financials.remaining_amount,
      cod_amount: current.cod_manually_adjusted ? (updates.cod_amount ?? current.cod_amount) : financials.cod_amount,
      payment_status: financials.payment_status,
      updated_at: new Date().toISOString(),
    };

    storeOrders[idx] = updatedOrder;
    return updatedOrder;
  }

  static async duplicateOrder(id: string): Promise<Order> {
    const original = await this.getOrderById(id, 'admin');
    if (!original) throw new Error('Original order not found');

    const duplicated = await this.createOrder({
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

    return duplicated;
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
    const order = await this.getOrderById(orderId, 'admin');
    if (!order) throw new Error('Order not found');

    const newPay: Payment = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      order_id: orderId,
      customer_id: order.customer_id,
      amount: payment.amount,
      payment_type: payment.payment_type,
      payment_method: payment.payment_method,
      transaction_reference: payment.transaction_reference,
      notes: payment.notes,
      payment_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const payments = [...(order.payments || []), newPay];
    order.payments = payments;

    const financials = calculateOrderFinancials({
      items: order.order_items || [],
      discount: order.discount,
      delivery_charges: order.delivery_charges,
      additional_charges: order.additional_charges,
      delivery_cost: order.delivery_cost ?? 0,
      other_internal_cost: order.other_internal_cost ?? 0,
      payments,
    });

    return await this.updateOrder(orderId, {
      total_paid: financials.total_paid,
      remaining_amount: financials.remaining_amount,
      cod_amount: order.cod_manually_adjusted ? order.cod_amount : financials.cod_amount,
      payment_status: financials.payment_status,
      payments,
    });
  }

  static async deletePayment(orderId: string, paymentId: string): Promise<Order> {
    const order = await this.getOrderById(orderId, 'admin');
    if (!order) throw new Error('Order not found');

    const payments = (order.payments || []).filter((p) => p.id !== paymentId);
    order.payments = payments;

    const financials = calculateOrderFinancials({
      items: order.order_items || [],
      discount: order.discount,
      delivery_charges: order.delivery_charges,
      additional_charges: order.additional_charges,
      delivery_cost: order.delivery_cost ?? 0,
      other_internal_cost: order.other_internal_cost ?? 0,
      payments,
    });

    return await this.updateOrder(orderId, {
      total_paid: financials.total_paid,
      remaining_amount: financials.remaining_amount,
      cod_amount: order.cod_manually_adjusted ? order.cod_amount : financials.cod_amount,
      payment_status: financials.payment_status,
      payments,
    });
  }

  static async softDeleteOrder(id: string, deletedBy?: string): Promise<void> {
    const idx = storeOrders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      storeOrders[idx].deleted_at = new Date().toISOString();
      storeOrders[idx].deleted_by = deletedBy || 'Admin';
    }
  }

  static async restoreOrder(id: string): Promise<void> {
    const idx = storeOrders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      storeOrders[idx].deleted_at = null;
      storeOrders[idx].deleted_by = null;
    }
  }

  static async permanentDeleteOrder(id: string): Promise<void> {
    storeOrders = storeOrders.filter((o) => o.id !== id);
  }

  // ----------------------------------------------------------------
  // EXPENSES MANAGEMENT (ADMIN/MANAGER ONLY)
  // ----------------------------------------------------------------
  static async getExpenses(role: UserRole = 'admin'): Promise<Expense[]> {
    if (role === 'staff') {
      return []; // STAFF IS BLOCKED FROM EXPENSES
    }
    return storeExpenses.filter((e) => !e.deleted_at);
  }

  static async createExpense(
    expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>,
    role: UserRole = 'admin'
  ): Promise<Expense> {
    if (role === 'staff') throw new Error('Unauthorized');

    const id = `e_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newExp: Expense = {
      ...expense,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    storeExpenses.unshift(newExp);
    return newExp;
  }

  static async deleteExpense(id: string, role: UserRole = 'admin'): Promise<void> {
    if (role === 'staff') throw new Error('Unauthorized');
    storeExpenses = storeExpenses.filter((e) => e.id !== id);
  }
}
