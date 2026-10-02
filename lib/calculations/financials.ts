import { OrderItem, Payment, PaymentStatus, OrderStatus } from '../types';

export function formatCurrency(amount: number | null | undefined, symbol: string = 'Rs.'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${symbol} 0`;
  }
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
  return `${symbol} ${formatted}`;
}

export function calculateItemTotals(quantity: number, sellingPrice: number, costPrice: number) {
  const qty = Math.max(1, quantity || 1);
  const sellPrice = Math.max(0, sellingPrice || 0);
  const cost = Math.max(0, costPrice || 0);

  const sellingTotal = Number((qty * sellPrice).toFixed(2));
  const costTotal = Number((qty * cost).toFixed(2));

  return {
    quantity: qty,
    selling_price: sellPrice,
    cost_price: cost,
    selling_total: sellingTotal,
    cost_total: costTotal,
  };
}

export interface CalculateOrderInputs {
  items: Array<{
    quantity: number;
    selling_price: number;
    cost_price: number;
  }>;
  discount?: number;
  delivery_charges?: number;
  additional_charges?: number;
  delivery_cost?: number;
  other_internal_cost?: number;
  payments?: Array<{ amount: number; payment_type?: string }>;
}

export function calculateOrderFinancials(inputs: CalculateOrderInputs) {
  const discount = Math.max(0, inputs.discount || 0);
  const delivery_charges = Math.max(0, inputs.delivery_charges || 0);
  const additional_charges = Math.max(0, inputs.additional_charges || 0);
  const delivery_cost = Math.max(0, inputs.delivery_cost || 0);
  const other_internal_cost = Math.max(0, inputs.other_internal_cost || 0);

  let subtotal = 0;
  let product_cost = 0;

  (inputs.items || []).forEach((item) => {
    const qty = Math.max(1, item.quantity || 1);
    subtotal += qty * (item.selling_price || 0);
    product_cost += qty * (item.cost_price || 0);
  });

  subtotal = Number(subtotal.toFixed(2));
  product_cost = Number(product_cost.toFixed(2));

  // Gross Revenue = Subtotal - Discount + Delivery Charges + Additional Charges
  let total_amount = subtotal - discount + delivery_charges + additional_charges;
  if (total_amount < 0) total_amount = 0;
  total_amount = Number(total_amount.toFixed(2));

  // Total Internal Cost = Product Cost + Delivery Cost + Other Internal Cost
  const total_cost = Number((product_cost + delivery_cost + other_internal_cost).toFixed(2));

  // Net Profit = Gross Revenue - Total Internal Cost
  const profit = Number((total_amount - total_cost).toFixed(2));

  // Sum valid payments
  let total_paid = 0;
  (inputs.payments || []).forEach((p) => {
    total_paid += p.amount || 0;
  });
  total_paid = Number(total_paid.toFixed(2));

  let remaining_amount = total_amount - total_paid;
  if (remaining_amount < 0) remaining_amount = 0;
  remaining_amount = Number(remaining_amount.toFixed(2));

  const cod_amount = remaining_amount;

  let payment_status: PaymentStatus = 'unpaid';
  if (total_paid <= 0) {
    payment_status = 'unpaid';
  } else if (total_paid < total_amount) {
    payment_status = 'partially_paid';
  } else {
    payment_status = 'paid';
  }

  return {
    subtotal,
    discount,
    delivery_charges,
    additional_charges,
    total_amount,
    product_cost,
    delivery_cost,
    other_internal_cost,
    total_cost,
    profit,
    total_paid,
    remaining_amount,
    cod_amount,
    payment_status,
  };
}

export function getOrderStatusBadge(status: OrderStatus): { label: string; bg: string; text: string } {
  switch (status) {
    case 'new':
      return { label: 'New Order', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300' };
    case 'confirmed':
      return { label: 'Confirmed', bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300' };
    case 'in_production':
      return { label: 'In Production', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300' };
    case 'ready':
      return { label: 'Ready', bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300' };
    case 'dispatched':
      return { label: 'Dispatched', bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300' };
    case 'delivered':
      return { label: 'Delivered', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300' };
    case 'completed':
      return { label: 'Completed', bg: 'bg-green-100 dark:bg-green-950/60', text: 'text-green-700 dark:text-green-300' };
    case 'on_hold':
      return { label: 'On Hold', bg: 'bg-orange-100 dark:bg-orange-950/60', text: 'text-orange-700 dark:text-orange-300' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300' };
    case 'returned':
      return { label: 'Returned', bg: 'bg-red-100 dark:bg-red-950/60', text: 'text-red-700 dark:text-red-300' };
    default:
      return { label: status, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' };
  }
}

export function getPaymentStatusBadge(status: PaymentStatus): { label: string; bg: string; text: string } {
  switch (status) {
    case 'paid':
      return { label: 'Paid', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300' };
    case 'partially_paid':
      return { label: 'Partially Paid', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300' };
    case 'unpaid':
      return { label: 'Unpaid', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300' };
    case 'refunded':
      return { label: 'Refunded', bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300' };
    default:
      return { label: status, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' };
  }
}
