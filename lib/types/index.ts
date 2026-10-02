export type UserRole = 'admin' | 'manager' | 'staff';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_code?: string | null;
  name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  address: string;
  city: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Product {
  id: string;
  sku?: string | null;
  name: string;
  category: string;
  description?: string | null;
  default_selling_price: number;
  default_cost_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'in_production'
  | 'ready'
  | 'dispatched'
  | 'delivered'
  | 'completed'
  | 'on_hold'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';

export type PaymentType = 'advance' | 'partial' | 'final' | 'cod' | 'refund';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'jazzcash'
  | 'easypaisa'
  | 'card'
  | 'cod'
  | 'other';

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string | null;
  item_name: string;
  description?: string | null;
  customization_details?: string | null;
  quantity: number;
  selling_price: number;
  cost_price: number;
  selling_total: number;
  cost_total: number;
  created_at?: string;
}

export interface Payment {
  id: string;
  order_id: string;
  customer_id?: string | null;
  amount: number;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  transaction_reference?: string | null;
  payment_date: string;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp?: string | null;
  customer_address: string;
  customer_city: string;
  order_date: string;
  required_delivery_date?: string | null;
  status: OrderStatus;
  
  // Revenue fields
  subtotal: number;
  discount: number;
  delivery_charges: number;
  additional_charges: number;
  total_amount: number;
  
  // Internal cost & profit fields (Optionally null for Staff)
  product_cost?: number | null;
  delivery_cost?: number | null;
  other_internal_cost?: number | null;
  total_cost?: number | null;
  profit?: number | null;
  
  // Payment fields
  total_paid: number;
  remaining_amount: number;
  cod_amount: number;
  cod_manually_adjusted?: boolean;
  cod_adjustment_reason?: string | null;
  payment_status: PaymentStatus;
  
  notes?: string | null;
  internal_notes?: string | null;
  assigned_to?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined relations
  order_items?: OrderItem[];
  payments?: Payment[];
  customer?: Customer;
}

export type ExpenseCategory =
  | 'printing'
  | 'raw_material'
  | 'packaging'
  | 'delivery'
  | 'electricity'
  | 'salary'
  | 'marketing'
  | 'maintenance'
  | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  expense_date: string;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status?: string | null;
  new_status: string;
  changed_by?: string | null;
  changed_at: string;
  notes?: string | null;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  created_at: string;
}

export interface BusinessSettings {
  id: number;
  business_name: string;
  logo_url?: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  order_prefix: string;
  default_delivery_charge: number;
  updated_at: string;
}

export type DateFilterPreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';
