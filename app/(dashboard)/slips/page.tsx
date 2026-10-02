'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FileText, Printer, CheckSquare, Square, Download } from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { Order, BusinessSettings } from '@/lib/types';
import { downloadOrderSlips } from '@/lib/docx/slip-generator';
import { useToast } from '@/components/ui/Toast';

export default function SlipsPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterPreset, setFilterPreset] = useState<string>('all');

  useEffect(() => {
    DataService.getOrders('admin').then((data) => {
      setOrders(data);
      setSelectedIds(data.map((o) => o.id));
    });
    DataService.getSettings().then(setSettings);
  }, []);

  const handleFilterPreset = (preset: string) => {
    setFilterPreset(preset);
    if (preset === 'all') {
      setSelectedIds(orders.map((o) => o.id));
    } else if (preset === 'ready') {
      setSelectedIds(orders.filter((o) => o.status === 'ready').map((o) => o.id));
    } else if (preset === 'dispatched') {
      setSelectedIds(orders.filter((o) => o.status === 'dispatched').map((o) => o.id));
    } else if (preset === '1') {
      setSelectedIds(orders.slice(0, 1).map((o) => o.id));
    } else if (preset === '10') {
      setSelectedIds(orders.slice(0, 10).map((o) => o.id));
    } else if (preset === '11') {
      setSelectedIds(orders.slice(0, 11).map((o) => o.id));
    }
  };

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

  const handleDownload = async () => {
    const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));
    if (selectedOrders.length === 0) {
      showToast('Please select at least one order', 'warning');
      return;
    }

    showToast(`Generating ${selectedOrders.length} NAAM Studio DOCX Order Slips...`, 'info');
    await downloadOrderSlips(selectedOrders, settings || undefined);
    showToast('Word Order Slips downloaded successfully!', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
            <Image src="/images/logo-icon.png" alt="NAAM Studio" width={40} height={40} className="object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">NAAM Studio Order Slip Generator</h1>
            <p className="text-xs text-slate-500 mt-0.5">A4 Portrait Microsoft Word (.DOCX) 2×5 Grid Parcel Labels</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={selectedIds.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Download Word DOCX ({selectedIds.length} Slips)
        </button>
      </div>

      {/* QUICK PRESETS FOR MANDATORY WORD SLIP TESTS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Test Presets (Verify A4 2×5 Grid Breakdown):</div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => handleFilterPreset('1')}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg font-bold"
          >
            1 Order (1 Slip / 1 Page)
          </button>
          <button
            type="button"
            onClick={() => handleFilterPreset('10')}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg font-bold"
          >
            10 Orders (1 Full A4 Page)
          </button>
          <button
            type="button"
            onClick={() => handleFilterPreset('11')}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg font-bold"
          >
            11 Orders (2 Pages: 10 + 1)
          </button>
          <button
            type="button"
            onClick={() => handleFilterPreset('ready')}
            className="px-3 py-1.5 bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 rounded-lg font-bold"
          >
            Ready Orders Only
          </button>
          <button
            type="button"
            onClick={() => handleFilterPreset('all')}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold"
          >
            Select All ({orders.length})
          </button>
        </div>
      </div>

      {/* SELECTION TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px]">
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
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Delivery Address</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">COD / Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.map((o) => {
              const isSelected = selectedIds.includes(o.id);
              return (
                <tr key={o.id} className={isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}>
                  <td className="py-3 px-4 text-center">
                    <button type="button" onClick={() => toggleSelect(o.id)}>
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{o.order_number}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{o.customer_name}</td>
                  <td className="py-3 px-4 text-slate-500">{o.customer_address}, {o.customer_city}</td>
                  <td className="py-3 px-4 uppercase text-[10px] font-bold text-amber-500">{o.status}</td>
                  <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                    Rs. {o.cod_amount ?? o.remaining_amount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
