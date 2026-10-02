'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Truck,
  CreditCard,
  AlertCircle,
  Plus,
  FileText,
  PackageSearch,
} from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { Order, DateFilterPreset, UserRole } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/financials';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole>('admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('this_month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
    setRole(savedRole);

    const handleRoleChanged = () => {
      const updatedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
      setRole(updatedRole);
      fetchDashboardData(updatedRole);
    };

    window.addEventListener('naam_role_changed', handleRoleChanged);
    fetchDashboardData(savedRole);

    return () => {
      window.removeEventListener('naam_role_changed', handleRoleChanged);
    };
  }, []);

  const fetchDashboardData = async (activeRole: UserRole) => {
    setLoading(true);
    const data = await DataService.getOrders(activeRole);
    setOrders(data);
    setLoading(false);
  };

  // REAL DATABASE KPIS
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => ['new', 'confirmed', 'on_hold'].includes(o.status)).length;
  const inProductionOrders = orders.filter((o) => o.status === 'in_production').length;
  const readyOrders = orders.filter((o) => o.status === 'ready').length;
  const dispatchedOrders = orders.filter((o) => o.status === 'dispatched').length;
  const deliveredOrders = orders.filter((o) => ['delivered', 'completed'].includes(o.status)).length;

  const totalSales = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalProfit = orders.reduce((sum, o) => sum + (o.profit || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (o.total_paid || 0), 0);
  const totalRemaining = orders.reduce((sum, o) => sum + (o.remaining_amount || 0), 0);
  const totalCodOutstanding = orders.reduce((sum, o) => sum + (o.cod_amount || 0), 0);

  // BUILD REAL CHARTS DATA FROM ACTUAL DATABASE ORDERS
  const salesByDateMap: Record<string, { sales: number; profit: number }> = {};
  orders.forEach((o) => {
    const dateStr = new Date(o.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!salesByDateMap[dateStr]) {
      salesByDateMap[dateStr] = { sales: 0, profit: 0 };
    }
    salesByDateMap[dateStr].sales += o.total_amount || 0;
    salesByDateMap[dateStr].profit += o.profit || 0;
  });

  const salesData = Object.keys(salesByDateMap).map((date) => ({
    date,
    sales: salesByDateMap[date].sales,
    profit: salesByDateMap[date].profit,
  }));

  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const statusData = [
    { name: 'New', value: statusCounts['new'] || 0, color: '#3b82f6' },
    { name: 'In Production', value: statusCounts['in_production'] || 0, color: '#f59e0b' },
    { name: 'Ready', value: statusCounts['ready'] || 0, color: '#14b8a6' },
    { name: 'Dispatched', value: statusCounts['dispatched'] || 0, color: '#a855f7' },
    { name: 'Delivered', value: statusCounts['delivered'] || 0, color: '#10b981' },
  ].filter((s) => s.value > 0);

  const paymentMethodMap: Record<string, number> = {};
  orders.forEach((o) => {
    (o.payments || []).forEach((p) => {
      const method = p.payment_method ? p.payment_method.replace('_', ' ').toUpperCase() : 'CASH';
      paymentMethodMap[method] = (paymentMethodMap[method] || 0) + p.amount;
    });
  });

  const paymentData = Object.keys(paymentMethodMap).map((name) => ({
    name,
    value: paymentMethodMap[name],
  }));

  return (
    <div className="space-y-6">
      {/* HEADER BAR & DATE FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            NAAM Studio Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time custom printing business analytics & order operations
          </p>
        </div>

        {/* DATE FILTER BUTTONS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['today', 'last_7_days', 'this_month', 'this_year'] as DateFilterPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => setDateFilter(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                dateFilter === preset
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {preset.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/orders/new"
          className="flex items-center gap-3 p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all group"
        >
          <div className="p-2 bg-white/20 rounded-lg group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold">New Order</div>
            <div className="text-[10px] text-indigo-200">Create print order</div>
          </div>
        </Link>

        <Link
          href="/customers"
          className="flex items-center gap-3 p-3.5 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-xl border border-slate-800 shadow-xs transition-all group"
        >
          <div className="p-2 bg-slate-800 rounded-lg text-amber-400 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold">New Customer</div>
            <div className="text-[10px] text-slate-400">Add client record</div>
          </div>
        </Link>

        <Link
          href="/slips"
          className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-all group"
        >
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Order Slips</div>
            <div className="text-[10px] text-slate-500">Generate DOCX Slips</div>
          </div>
        </Link>

        {role !== 'staff' ? (
          <Link
            href="/expenses"
            className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-all group"
          >
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Add Expense</div>
              <div className="text-[10px] text-slate-500">Log shop cost</div>
            </div>
          </Link>
        ) : (
          <Link
            href="/orders"
            className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-all group"
          >
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-lg text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Pending Jobs</div>
              <div className="text-[10px] text-slate-500">View print queue</div>
            </div>
          </Link>
        )}
      </div>

      {/* FINANCIAL STAT CARDS (PROFIT/COSTS HIDDEN FOR STAFF) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL SALES */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Total Sales Revenue</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(totalSales)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Real orders total
          </div>
        </div>

        {/* NET PROFIT (HIDDEN FOR STAFF ROLE) */}
        {role !== 'staff' ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Net Business Profit</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalProfit)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Revenue minus Total Costs
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Payments Received</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalPaid)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Confirmed customer payments</div>
          </div>
        )}

        {/* REMAINING OUTSTANDING */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Remaining Balance</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(totalRemaining)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Uncollected customer amounts</div>
        </div>

        {/* COD OUTSTANDING */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>COD Outstanding</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {formatCurrency(totalCodOutstanding)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Courier collection expected</div>
        </div>
      </div>

      {/* EMPTY STATE BANNER IF ZERO ORDERS EXIST */}
      {totalOrders === 0 && !loading && (
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
          <PackageSearch className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">No orders recorded yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first custom print order to start tracking revenue, net profit, and COD collections.
          </p>
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
          >
            <Plus className="w-4 h-4" /> Create First Order
          </Link>
        </div>
      )}

      {/* ORDER STATUS STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-xs text-slate-500 font-semibold">Total Orders</div>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100">{totalOrders}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Pending</div>
          <div className="text-lg font-black text-blue-600 dark:text-blue-400">{pendingOrders}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">In Production</div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400">{inProductionOrders}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Ready</div>
          <div className="text-lg font-black text-teal-600 dark:text-teal-400">{readyOrders}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Dispatched</div>
          <div className="text-lg font-black text-purple-600 dark:text-purple-400">{dispatchedOrders}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Delivered</div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{deliveredOrders}</div>
        </div>
      </div>

      {/* ANALYTICS CHARTS */}
      <AnalyticsCharts role={role} salesData={salesData} statusData={statusData} paymentData={paymentData} />
    </div>
  );
}
