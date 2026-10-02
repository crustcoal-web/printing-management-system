'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  Printer,
  Copy,
  PackageSearch,
} from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { Order, OrderStatus, PaymentStatus, UserRole } from '@/lib/types';
import { formatCurrency, getOrderStatusBadge, getPaymentStatusBadge } from '@/lib/calculations/financials';
import { downloadOrderSlips } from '@/lib/docx/slip-generator';
import { useToast } from '@/components/ui/Toast';
import { DeleteConfirmModal } from '@/components/ui/Modal';

export default function OrdersPage() {
  const { showToast } = useToast();
  const [role, setRole] = useState<UserRole>('admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // FILTERS
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  // BULK SELECTION FOR DOCX SLIPS
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // DELETE MODAL STATE
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  useEffect(() => {
    const savedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
    setRole(savedRole);

    const handleRoleChanged = () => {
      const updatedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
      setRole(updatedRole);
      fetchOrders(updatedRole);
    };

    window.addEventListener('naam_role_changed', handleRoleChanged);
    fetchOrders(savedRole);

    return () => {
      window.removeEventListener('naam_role_changed', handleRoleChanged);
    };
  }, [search, statusFilter, paymentStatusFilter]);

  const fetchOrders = async (activeRole: UserRole) => {
    setLoading(true);
    const data = await DataService.getOrders(activeRole, {
      search: search || undefined,
      status: statusFilter !== 'all' ? (statusFilter as OrderStatus) : undefined,
      paymentStatus: paymentStatusFilter !== 'all' ? (paymentStatusFilter as PaymentStatus) : undefined,
    });
    setOrders(data);
    setLoading(false);
  };

  // BULK SELECT TOGGLE
  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // DUPLICATE ORDER
  const handleDuplicateOrder = async (orderId: string) => {
    try {
      const dup = await DataService.duplicateOrder(orderId);
      showToast(`Order duplicated cleanly as ${dup.order_number}`, 'success');
      fetchOrders(role);
    } catch (err: any) {
      showToast('Error duplicating order', 'error');
    }
  };

  // SOFT DELETE ORDER CONFIRM
  const handleSoftDeleteOrder = async () => {
    if (!deletingOrder) return;
    await DataService.softDeleteOrder(deletingOrder.id);
    showToast(`Order ${deletingOrder.order_number} moved to Trash`, 'success');
    setDeletingOrder(null);
    fetchOrders(role);
  };

  // GENERATE DOCX SLIPS FOR SELECTED ORDERS
  const handleGenerateSelectedSlips = async () => {
    const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));
    if (selectedOrders.length === 0) {
      showToast('Please select at least one order using checkboxes', 'warning');
      return;
    }

    showToast(`Generating ${selectedOrders.length} NAAM Studio DOCX Order Slips...`, 'info');
    const settings = await DataService.getSettings();
    await downloadOrderSlips(selectedOrders, settings);
    showToast('Word Order Slips downloaded successfully!', 'success');
  };

  // SINGLE PRINT SLIP
  const handlePrintSingleSlip = async (order: Order) => {
    showToast(`Generating slip for ${order.order_number}...`, 'info');
    const settings = await DataService.getSettings();
    await downloadOrderSlips([order], settings);
    showToast('Order Slip downloaded!', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Orders Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage custom print orders, payments, COD & DOCX slips
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* BULK SLIP GENERATOR BUTTON */}
          <button
            type="button"
            onClick={handleGenerateSelectedSlips}
            disabled={selectedIds.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-slate-100 disabled:opacity-40 rounded-xl text-xs font-bold border border-slate-700 transition-all shadow-xs"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Generate Selected Slips ({selectedIds.length})</span>
          </button>

          <Link
            href="/orders/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> New Order
          </Link>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* SEARCH */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, Customer Name, Phone Number..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* STATUS FILTER */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Order Statuses</option>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_production">In Production</option>
            <option value="ready">Ready</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* PAYMENT STATUS FILTER */}
        <div className="sm:col-span-3">
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Payment Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <button type="button" onClick={toggleSelectAll}>
                    {selectedIds.length > 0 && selectedIds.length === orders.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer & Phone</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right text-emerald-600">Paid</th>
                <th className="py-3 px-4 text-right text-rose-600">COD</th>
                {role !== 'staff' && <th className="py-3 px-4 text-right text-emerald-500 font-black">Profit</th>}
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={role !== 'staff' ? 11 : 10} className="py-12 text-center text-slate-500 font-medium">
                    <div className="space-y-2">
                      <PackageSearch className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">No print orders found</p>
                      <p className="text-[11px] text-slate-500">Create your first order to start managing custom printing jobs.</p>
                      <Link
                        href="/orders/new"
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-xs mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Order
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const statusBadge = getOrderStatusBadge(o.status);
                  const payBadge = getPaymentStatusBadge(o.payment_status);
                  const isSelected = selectedIds.includes(o.id);

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button type="button" onClick={() => toggleSelect(o.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-indigo-600 dark:text-indigo-400">
                        <Link href={`/orders/${o.id}`} className="hover:underline">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{o.customer_name}</div>
                        <div className="text-slate-400 text-[11px]">{o.customer_phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(o.order_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${payBadge.bg} ${payBadge.text}`}>
                          {payBadge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-slate-100">
                        {formatCurrency(o.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                        {formatCurrency(o.total_paid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        {formatCurrency(o.cod_amount)}
                      </td>
                      {role !== 'staff' && (
                        <td className="py-3.5 px-4 text-right font-black text-emerald-500">
                          {formatCurrency(o.profit)}
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/orders/${o.id}`}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDuplicateOrder(o.id)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            title="Duplicate Order"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintSingleSlip(o)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            title="Print Word Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingOrder(o)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                            title="Move to Trash"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!deletingOrder}
        onClose={() => setDeletingOrder(null)}
        onConfirm={handleSoftDeleteOrder}
        title="Move Order to Trash"
        message={`Are you sure you want to move order ${deletingOrder?.order_number} to Trash?`}
      />
    </div>
  );
}
