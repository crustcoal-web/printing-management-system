'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileSpreadsheet, Printer, ShieldAlert, PackageSearch } from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { Order, UserRole, Expense } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/financials';
import { exportToExcel, exportToCSV, triggerPrint } from '@/lib/utils/export-utils';

export default function ReportsPage() {
  const [role, setRole] = useState<UserRole>('admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reportTab, setReportTab] = useState<'sales' | 'profit' | 'payments' | 'expenses' | 'cod'>('sales');

  useEffect(() => {
    const savedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
    setRole(savedRole);

    const handleRoleChanged = () => {
      const updatedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
      setRole(updatedRole);
      if (updatedRole !== 'staff') {
        fetchData(updatedRole);
      }
    };

    window.addEventListener('naam_role_changed', handleRoleChanged);
    if (savedRole !== 'staff') {
      fetchData(savedRole);
    }

    return () => {
      window.removeEventListener('naam_role_changed', handleRoleChanged);
    };
  }, []);

  const fetchData = async (activeRole: UserRole) => {
    const o = await DataService.getOrders(activeRole);
    const e = await DataService.getExpenses(activeRole);
    setOrders(o);
    setExpenses(e);
  };

  if (role === 'staff') {
    return (
      <div className="p-12 text-center max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Staff role accounts are restricted from viewing financial business reports and profit metrics.
        </p>
      </div>
    );
  }

  const handleExportExcel = () => {
    if (reportTab === 'expenses') {
      const data = expenses.map((e) => ({
        Date: new Date(e.expense_date).toLocaleDateString(),
        Category: e.category.replace('_', ' ').toUpperCase(),
        Description: e.description,
        Method: e.payment_method,
        Amount: e.amount,
      }));
      exportToExcel(data, `NAAM-Studio-Expenses-Report`);
    } else {
      const data = orders.map((o) => ({
        'Order ID': o.order_number,
        Customer: o.customer_name,
        Phone: o.customer_phone,
        'Order Date': new Date(o.order_date).toLocaleDateString(),
        Status: o.status,
        'Total Amount': o.total_amount,
        'Total Paid': o.total_paid,
        'Remaining Balance': o.remaining_amount,
        'COD Amount': o.cod_amount,
        'Net Profit': o.profit,
      }));
      exportToExcel(data, `NAAM-Studio-${reportTab.toUpperCase()}-Report`);
    }
  };

  const handleExportCSV = () => {
    if (reportTab === 'expenses') {
      const data = expenses.map((e) => ({
        Date: new Date(e.expense_date).toLocaleDateString(),
        Category: e.category.replace('_', ' ').toUpperCase(),
        Description: e.description,
        Method: e.payment_method,
        Amount: e.amount,
      }));
      exportToCSV(data, `NAAM-Studio-Expenses-Report`);
    } else {
      const data = orders.map((o) => ({
        'Order ID': o.order_number,
        Customer: o.customer_name,
        Phone: o.customer_phone,
        'Order Date': new Date(o.order_date).toLocaleDateString(),
        Status: o.status,
        'Total Amount': o.total_amount,
        'Total Paid': o.total_paid,
        'Remaining Balance': o.remaining_amount,
        'COD Amount': o.cod_amount,
        'Net Profit': o.profit,
      }));
      exportToCSV(data, `NAAM-Studio-${reportTab.toUpperCase()}-Report`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Financial Reports & Statements</h1>
          <p className="text-xs text-slate-500 mt-0.5">Export XLSX, CSV & Print PDF business statements</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export XLSX
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={triggerPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print PDF
          </button>
        </div>
      </div>

      {/* REPORT TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'sales', label: 'Sales Report (Order Date)' },
          { id: 'profit', label: 'Profit Statement' },
          { id: 'payments', label: 'Payments Report (Payment Date)' },
          { id: 'cod', label: 'COD Outstanding Report' },
          { id: 'expenses', label: 'Expenses Report (Expense Date)' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportTab(t.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              reportTab === t.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* REPORT DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {reportTab === 'expenses' ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Expense Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="py-3 px-4 text-slate-500">{new Date(e.expense_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-amber-500">{e.category.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{e.description}</td>
                    <td className="py-3 px-4 text-slate-500">{e.payment_method}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                      - {formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4 text-right">Gross Revenue</th>
                <th className="py-3 px-4 text-right text-amber-500">Total Internal Cost</th>
                <th className="py-3 px-4 text-right text-emerald-500 font-black">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    <div className="space-y-2">
                      <PackageSearch className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">No report records found</p>
                      <p className="text-[11px] text-slate-500">Orders created will be reflected in financial reports automatically.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{o.order_number}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">{o.customer_name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(o.order_date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right font-bold">{formatCurrency(o.total_amount)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-500">{formatCurrency(o.total_cost)}</td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-500">{formatCurrency(o.profit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
