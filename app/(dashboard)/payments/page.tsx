'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, Search, Trash2, Receipt } from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { Order, Payment } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/financials';
import { useToast } from '@/components/ui/Toast';
import { DeleteConfirmModal } from '@/components/ui/Modal';

export default function PaymentsPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deletingPayment, setDeletingPayment] = useState<{ orderId: string; paymentId: string; amount: number; orderNumber: string } | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const data = await DataService.getOrders('admin', { includeDeleted: false });
    setOrders(data);
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;
    try {
      await DataService.deletePayment(deletingPayment.orderId, deletingPayment.paymentId);
      showToast('Payment removed. Order balance recalculated.', 'success');
      setDeletingPayment(null);
      fetchPayments();
    } catch (err: any) {
      showToast('Error removing payment', 'error');
    }
  };

  const allPayments: Array<Payment & { order_number: string; customer_name: string }> = [];
  orders.forEach((o) => {
    (o.payments || []).forEach((p) => {
      allPayments.push({
        ...p,
        order_number: o.order_number,
        customer_name: o.customer_name,
      });
    });
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Payments Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">Customer payments, advances & COD collections</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Method</th>
              <th className="py-3 px-4">TID / Reference</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {allPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                  <div className="space-y-2">
                    <CreditCard className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No payment records found</p>
                    <p className="text-[11px] text-slate-500">Payments added to print orders will be listed here automatically.</p>
                  </div>
                </td>
              </tr>
            ) : (
              allPayments.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 px-4 text-slate-500">{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    <Link href={`/orders/${p.order_id}`} className="hover:underline">
                      {p.order_number}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{p.customer_name}</td>
                  <td className="py-3 px-4 uppercase text-[10px] font-extrabold text-amber-500">{p.payment_type}</td>
                  <td className="py-3 px-4 text-slate-500 font-semibold">{p.payment_method}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{p.transaction_reference || '-'}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                    + {formatCurrency(p.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setDeletingPayment({
                          orderId: p.order_id,
                          paymentId: p.id,
                          amount: p.amount,
                          orderNumber: p.order_number,
                        })
                      }
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                      title="Delete Payment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleDeletePayment}
        title="Remove Payment Record"
        message={`Are you sure you want to remove payment of ${formatCurrency(deletingPayment?.amount)} for order ${deletingPayment?.orderNumber}? Order remaining balance will be recalculated automatically.`}
      />
    </div>
  );
}
