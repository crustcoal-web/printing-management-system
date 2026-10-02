'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, Plus, ShieldAlert, Trash2, Edit, CreditCard } from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { Expense, ExpenseCategory, UserRole } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/financials';
import { useToast } from '@/components/ui/Toast';
import { Modal, DeleteConfirmModal } from '@/components/ui/Modal';

export default function ExpensesPage() {
  const { showToast } = useToast();
  const [role, setRole] = useState<UserRole>('admin');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const [category, setCategory] = useState<ExpenseCategory>('raw_material');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    const savedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
    setRole(savedRole);

    const handleRoleChanged = () => {
      const updatedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
      setRole(updatedRole);
      fetchExpenses(updatedRole);
    };

    window.addEventListener('naam_role_changed', handleRoleChanged);
    fetchExpenses(savedRole);

    return () => {
      window.removeEventListener('naam_role_changed', handleRoleChanged);
    };
  }, []);

  const fetchExpenses = async (activeRole: UserRole) => {
    const data = await DataService.getExpenses(activeRole);
    setExpenses(data);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.createExpense(
        {
          category,
          description,
          amount,
          payment_method: paymentMethod as any,
          expense_date: new Date().toISOString(),
        },
        role
      );
      showToast('Expense recorded successfully!', 'success');
      setIsModalOpen(false);
      setDescription('');
      setAmount(0);
      fetchExpenses(role);
    } catch (err: any) {
      showToast('Error recording expense', 'error');
    }
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;
    try {
      await DataService.deleteExpense(deletingExpense.id, role);
      showToast('Expense deleted cleanly', 'success');
      setDeletingExpense(null);
      fetchExpenses(role);
    } catch (err: any) {
      showToast('Error deleting expense', 'error');
    }
  };

  // REQUIREMENT 3: STAFF USERS MUST NOT BE ABLE TO ACCESS EXPENSE RECORDS
  if (role === 'staff') {
    return (
      <div className="p-12 text-center max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Staff role accounts are restricted from accessing internal business operational expense records and financial logs.
        </p>
      </div>
    );
  }

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Operational Expenses</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track raw materials, electricity, delivery & shop costs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400">
            Total: {formatCurrency(totalExpense)}
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                  <div className="space-y-2">
                    <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No expenses recorded</p>
                    <p className="text-[11px] text-slate-500">Log shop operational expenses to calculate accurate net business profit.</p>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-xs mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log First Expense
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id}>
                  <td className="py-3 px-4 text-slate-500">{new Date(e.expense_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-bold uppercase text-[10px] text-amber-500">{e.category.replace('_', ' ')}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{e.description}</td>
                  <td className="py-3 px-4 text-slate-500">{e.payment_method}</td>
                  <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                    - {formatCurrency(e.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setDeletingExpense(e)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                      title="Delete Expense"
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Operational Expense">
        <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="raw_material">Raw Material</option>
              <option value="printing">Printing Supplies</option>
              <option value="packaging">Packaging</option>
              <option value="delivery">Delivery / Courier</option>
              <option value="electricity">Electricity / Utility</option>
              <option value="salary">Salary / Labor</option>
              <option value="marketing">Marketing / Ads</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">Description *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Epson ink set purchase"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Amount *</label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-rose-600"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md"
            >
              Save Expense
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense Record"
        message={`Are you sure you want to delete expense record "${deletingExpense?.description}" for ${formatCurrency(deletingExpense?.amount)}?`}
      />
    </div>
  );
}
