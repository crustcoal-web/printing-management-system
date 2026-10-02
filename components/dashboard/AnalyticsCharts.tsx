'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/calculations/financials';
import { UserRole } from '@/lib/types';
import { BarChart3, TrendingUp, PackageSearch } from 'lucide-react';

interface AnalyticsChartsProps {
  role?: UserRole;
  currencySymbol?: string;
  salesData?: Array<{ date: string; sales: number; profit: number }>;
  statusData?: Array<{ name: string; value: number; color: string }>;
  paymentData?: Array<{ name: string; value: number }>;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  role = 'admin',
  currencySymbol = 'Rs.',
  salesData = [],
  statusData = [],
  paymentData = [],
}) => {
  const PIE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  const hasSalesData = salesData.some((d) => d.sales > 0 || d.profit > 0);
  const hasStatusData = statusData.some((d) => d.value > 0);
  const hasPaymentData = paymentData.some((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
      {/* CHART 1: DAILY SALES & PROFIT OVERVIEW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Sales {role !== 'staff' && '& Profit'} Performance
            </h3>
            <p className="text-xs text-slate-500">Revenue overview for current date filter</p>
          </div>
        </div>

        <div className="h-64 w-full flex-1 flex items-center justify-center">
          {hasSalesData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  {role !== 'staff' && (
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value), currencySymbol)]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                {role !== 'staff' && (
                  <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 px-4">
              <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Sales Data Available</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Create your first order to start tracking revenue and net profit trends.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CHART 2: ORDERS BY STATUS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Orders by Status</h3>
            <p className="text-xs text-slate-500">Distribution of active print jobs</p>
          </div>
        </div>

        <div className="h-64 w-full flex-1 flex items-center justify-center">
          {hasStatusData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 px-4">
              <PackageSearch className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Orders Recorded</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Order status breakdown will display here when print orders are logged.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CHART 3: PAYMENT METHOD BREAKDOWN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Payment Methods Breakdown</h3>
            <p className="text-xs text-slate-500">Revenue split across JazzCash, Bank Transfer, Cash & COD</p>
          </div>
        </div>

        <div className="h-56 w-full flex-1 flex items-center justify-center">
          {hasPaymentData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value), currencySymbol)]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="value" name="Total Collected" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-6 px-4">
              <BarChart3 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Payment History</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Payment collection channels will be summarized here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
