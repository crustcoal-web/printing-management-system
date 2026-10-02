'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  Edit,
  Trash2,
  Clock,
  User,
  MapPin,
  Phone,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { Order, OrderStatus, UserRole, PaymentType, PaymentMethod } from '@/lib/types';
import { formatCurrency, getOrderStatusBadge, getPaymentStatusBadge } from '@/lib/calculations/financials';
import { downloadOrderSlips } from '@/lib/docx/slip-generator';
import { useToast } from '@/components/ui/Toast';
import { Modal, DeleteConfirmModal } from '@/components/ui/Modal';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const orderId = params.id as string;

  const [role, setRole] = useState<UserRole>('admin');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // MODAL STATES
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // PAYMENT FORM
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<PaymentType>('partial');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('jazzcash');
  const [txnRef, setTxnRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // STATUS FORM
  const [newStatus, setNewStatus] = useState<OrderStatus>('confirmed');
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    const savedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
    setRole(savedRole);
    fetchOrder(savedRole);
  }, [orderId]);

  const fetchOrder = async (activeRole: UserRole) => {
    setLoading(true);
    const data = await DataService.getOrderById(orderId, activeRole);
    if (data) {
      setOrder(data);
      setNewStatus(data.status);
      setPaymentAmount(data.remaining_amount);
    }
    setLoading(false);
  };

  // PRINT SINGLE SLIP
  const handlePrintSlip = async () => {
    if (!order) return;
    showToast('Generating NAAM Studio DOCX Order Slip...', 'info');
    const settings = await DataService.getSettings();
    await downloadOrderSlips([order], settings);
    showToast('Order Slip downloaded successfully!', 'success');
  };

  // ADD PAYMENT SUBMIT
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || paymentAmount <= 0) return;

    try {
      const updated = await DataService.addPayment(order.id, {
        amount: paymentAmount,
        payment_type: paymentType,
        payment_method: paymentMethod,
        transaction_reference: txnRef,
        notes: payNotes,
      });
      setOrder(updated);
      setIsPaymentModalOpen(false);
      showToast('Payment added successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error adding payment', 'error');
    }
  };

  // CHANGE STATUS SUBMIT
  const handleChangeStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    try {
      const updated = await DataService.updateOrder(order.id, {
        status: newStatus,
      });
      setOrder(updated);
      setIsStatusModalOpen(false);
      showToast(`Status updated to ${newStatus.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  // SOFT DELETE ORDER
  const handleDeleteOrder = async () => {
    if (!order) return;
    await DataService.softDeleteOrder(order.id);
    setIsDeleteModalOpen(false);
    showToast(`Order ${order.order_number} moved to Trash`, 'success');
    router.push('/orders');
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading NAAM Studio Order...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-rose-500 font-bold">Order not found</div>;
  }

  const orderBadge = getOrderStatusBadge(order.status);
  const paymentBadge = getPaymentStatusBadge(order.payment_status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* HEADER TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">{order.order_number}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${orderBadge.bg} ${orderBadge.text}`}>
                {orderBadge.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${paymentBadge.bg} ${paymentBadge.text}`}>
                {paymentBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created on {new Date(order.order_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrintSlip}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Slip (.DOCX)
          </button>

          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            <CreditCard className="w-4 h-4" /> Add Payment
          </button>

          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold"
          >
            <Clock className="w-4 h-4 text-amber-400" /> Change Status
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: CUSTOMER & ITEMS */}
        <div className="lg:col-span-2 space-y-6">
          {/* CUSTOMER DETAILS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> Customer Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{order.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Phone / WhatsApp</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{order.customer_phone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-semibold block">Delivery Address</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {order.customer_address}, {order.customer_city}
                </span>
              </div>
            </div>
          </div>

          {/* ORDER ITEMS TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Order Items ({order.order_items?.length || 0})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5">Item</th>
                    <th className="py-2.5">Customization</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Selling Price</th>
                    {role !== 'staff' && <th className="py-2.5 text-right text-amber-500">Internal Cost</th>}
                    <th className="py-2.5 text-right font-black">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(order.order_items || []).map((item, idx) => (
                    <tr key={idx} className="font-medium">
                      <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{item.item_name}</td>
                      <td className="py-3 text-slate-500">{item.customization_details || '-'}</td>
                      <td className="py-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-3 text-right">{formatCurrency(item.selling_price)}</td>
                      {role !== 'staff' && (
                        <td className="py-3 text-right text-amber-500 font-bold">{formatCurrency(item.cost_price)}</td>
                      )}
                      <td className="py-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(item.selling_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAYMENT HISTORY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Payment History ({(order.payments || []).length})
            </h3>
            {(!order.payments || order.payments.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No payments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {order.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 uppercase">{p.payment_type}</span>
                      <span className="text-slate-400 ml-2">via {p.payment_method}</span>
                      {p.transaction_reference && (
                        <span className="text-slate-500 ml-2 font-mono text-[10px]">Ref: {p.transaction_reference}</span>
                      )}
                    </div>
                    <div className="font-black text-emerald-600 dark:text-emerald-400">
                      + {formatCurrency(p.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: FINANCIAL SUMMARY */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Financial Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Products Subtotal:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-rose-500">
                <span>Discount:</span>
                <span>- {formatCurrency(order.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Fee (Customer):</span>
                <span>+ {formatCurrency(order.delivery_charges)}</span>
              </div>
              <div className="flex justify-between font-black text-sm border-t border-slate-100 dark:border-slate-800 pt-2">
                <span>Order Total:</span>
                <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            {/* INTERNAL COSTS & PROFIT (STRICT REQUIREMENT: HIDDEN FOR STAFF ROLE) */}
            {role !== 'staff' && (
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl space-y-2 text-xs border border-slate-200 dark:border-slate-700/80">
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                  <span>Product Internal Cost:</span>
                  <span>{formatCurrency(order.product_cost)}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                  <span>Courier Delivery Cost:</span>
                  <span>{formatCurrency(order.delivery_cost)}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                  <span>Other Internal Cost:</span>
                  <span>{formatCurrency(order.other_internal_cost)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-black text-sm border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span>Net Order Profit:</span>
                  <span>{formatCurrency(order.profit)}</span>
                </div>
              </div>
            )}

            {/* BALANCE & COD */}
            <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Total Paid Received:</span>
                <span>{formatCurrency(order.total_paid)}</span>
              </div>
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Remaining Balance:</span>
                <span>{formatCurrency(order.remaining_amount)}</span>
              </div>
              <div className="flex justify-between font-black text-rose-600 dark:text-rose-400 text-sm bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60">
                <span>COD Outstanding:</span>
                <span>{formatCurrency(order.cod_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD PAYMENT MODAL */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Add Order Payment">
        <form onSubmit={handleAddPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Amount *</label>
            <input
              type="number"
              min="1"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Type</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="advance">Advance Payment</option>
              <option value="partial">Partial Payment</option>
              <option value="final">Final Payment</option>
              <option value="cod">COD Payment</option>
              <option value="refund">Refund</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="jazzcash">JazzCash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="cod">COD</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref / TID</label>
            <input
              type="text"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
              placeholder="e.g. TXN-998811"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
            >
              Save Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* CHANGE STATUS MODAL */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Change Order Status">
        <form onSubmit={handleChangeStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="new">New</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_production">In Production</option>
              <option value="ready">Ready</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
            >
              Update Status
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteOrder}
        message={`Are you sure you want to move order ${order.order_number} to Trash?`}
      />
    </div>
  );
}
