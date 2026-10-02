'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Phone, MapPin, ShoppingBag, Trash2, Edit, Eye, UserCheck } from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { Customer, Order } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/financials';
import { useToast } from '@/components/ui/Toast';
import { Modal, DeleteConfirmModal } from '@/components/ui/Modal';

export default function CustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // FORM
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCustomersAndOrders();
  }, []);

  const fetchCustomersAndOrders = async () => {
    const cData = await DataService.getCustomers();
    const oData = await DataService.getOrders('admin', { includeDeleted: true });
    setCustomers(cData);
    setOrders(oData);
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setAddress('');
    setCity('Lahore');
    setNotes('');
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newC = await DataService.createCustomer({
        name,
        phone,
        whatsapp: whatsapp || phone,
        email,
        address,
        city,
        notes,
      });
      showToast(`Customer ${newC.name} created!`, 'success');
      setIsAddModalOpen(false);
      resetForm();
      fetchCustomersAndOrders();
    } catch (err: any) {
      showToast('Error creating customer', 'error');
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await DataService.updateCustomer(editingCustomer.id, {
        name,
        phone,
        whatsapp,
        email,
        address,
        city,
        notes,
      });
      showToast(`Customer ${name} updated!`, 'success');
      setEditingCustomer(null);
      resetForm();
      fetchCustomersAndOrders();
    } catch (err: any) {
      showToast('Error updating customer', 'error');
    }
  };

  const handleSoftDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    await DataService.deleteCustomer(deletingCustomer.id);
    showToast(`Customer ${deletingCustomer.name} archived cleanly`, 'success');
    setDeletingCustomer(null);
    fetchCustomersAndOrders();
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setWhatsapp(c.whatsapp || '');
    setEmail(c.email || '');
    setAddress(c.address);
    setCity(c.city);
    setNotes(c.notes || '');
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">NAAM Studio client ledger & phone records</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Customer Name, Phone..."
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
          <UserCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">No customers found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Customers will appear here when added manually or automatically created during order entry.
          </p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md"
          >
            <Plus className="w-4 h-4" /> Create First Customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const custOrders = orders.filter((o) => o.customer_id === c.id);
            const totalSpent = custOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            const totalPaid = custOrders.reduce((sum, o) => sum + (o.total_paid || 0), 0);
            const outstanding = totalSpent - totalPaid;

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{c.name}</h3>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-bold">
                      {c.customer_code}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-500" /> {c.phone}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" /> {c.address}, {c.city}
                    </div>
                  </div>

                  {/* SUMMARY BOX */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-[11px]">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>Total Orders:</span>
                      <span>{custOrders.length}</span>
                    </div>
                    <div className="flex justify-between font-bold text-indigo-600 dark:text-indigo-400">
                      <span>Total Purchases:</span>
                      <span>{formatCurrency(totalSpent)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400">
                      <span>Outstanding:</span>
                      <span>{formatCurrency(outstanding > 0 ? outstanding : 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewingCustomer(c)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    title="View Customer Order History"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    title="Edit Customer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCustomer(c)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                    title="Archive Customer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CUSTOMER MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer">
        <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Phone Number *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Delivery Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md">
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT CUSTOMER MODAL */}
      <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)} title="Edit Customer Details">
        <form onSubmit={handleUpdateCustomer} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Phone Number *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Delivery Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md">
              Update Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CUSTOMER CONFIRMATION */}
      <DeleteConfirmModal
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleSoftDeleteCustomer}
        title="Archive Customer"
        message={`Are you sure you want to archive customer ${deletingCustomer?.name}? Historical order records will be preserved.`}
      />
    </div>
  );
}
