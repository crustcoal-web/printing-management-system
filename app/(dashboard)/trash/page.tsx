'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, ShieldAlert, AlertTriangle } from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { Order, UserRole } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/financials';
import { useToast } from '@/components/ui/Toast';
import { DeleteConfirmModal } from '@/components/ui/Modal';

export default function TrashPage() {
  const { showToast } = useToast();
  const [role, setRole] = useState<UserRole>('admin');
  const [deletedOrders, setDeletedOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPermanentModalOpen, setIsPermanentModalOpen] = useState(false);

  useEffect(() => {
    const savedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
    setRole(savedRole);

    const handleRoleChanged = () => {
      const updatedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
      setRole(updatedRole);
      fetchTrashOrders(updatedRole);
    };

    window.addEventListener('naam_role_changed', handleRoleChanged);
    fetchTrashOrders(savedRole);

    return () => {
      window.removeEventListener('naam_role_changed', handleRoleChanged);
    };
  }, []);

  const fetchTrashOrders = async (activeRole: UserRole) => {
    const all = await DataService.getOrders(activeRole, { includeDeleted: true });
    setDeletedOrders(all.filter((o) => !!o.deleted_at));
  };

  const handleRestore = async (id: string) => {
    await DataService.restoreOrder(id);
    showToast('Order restored successfully! Returned to active sales & profit', 'success');
    fetchTrashOrders(role);
  };

  const handlePermanentDelete = async () => {
    if (!selectedOrder) return;
    if (role !== 'admin') {
      showToast('Only Admin users can permanently delete orders!', 'error');
      return;
    }

    await DataService.permanentDeleteOrder(selectedOrder.id);
    setIsPermanentModalOpen(false);
    showToast(`Order ${selectedOrder.order_number} permanently deleted`, 'success');
    fetchTrashOrders(role);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" /> Deleted Orders / Trash
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Soft deleted orders are excluded from dashboard stats, sales & profit analytics
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Order Date</th>
              <th className="py-3 px-4">Deleted Date</th>
              <th className="py-3 px-4">Deleted By</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {deletedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                  Trash is empty. No deleted orders.
                </td>
              </tr>
            ) : (
              deletedOrders.map((o) => (
                <tr key={o.id}>
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-500">{o.order_number}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">{o.customer_name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{new Date(o.order_date).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 text-rose-500 font-semibold">
                    {o.deleted_at ? new Date(o.deleted_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{o.deleted_by || 'Admin'}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(o.total_amount)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestore(o.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 rounded-lg font-bold hover:bg-emerald-100"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(o);
                          setIsPermanentModalOpen(true);
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                        title="Delete Permanently (Admin Only)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={isPermanentModalOpen}
        onClose={() => setIsPermanentModalOpen(false)}
        onConfirm={handlePermanentDelete}
        title="Permanent Delete Order"
        message={`WARNING: This action CANNOT be undone. Order ${selectedOrder?.order_number} will be permanently purged from the database.`}
        isPermanent={true}
      />
    </div>
  );
}
