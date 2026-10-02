'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, PackageSearch } from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { Product, UserRole } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/financials';
import { useToast } from '@/components/ui/Toast';
import { Modal, DeleteConfirmModal } from '@/components/ui/Modal';

export default function ProductsPage() {
  const { showToast } = useToast();
  const [role, setRole] = useState<UserRole>('admin');
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Apparel');
  const [sellingPrice, setSellingPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);

  useEffect(() => {
    const savedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
    setRole(savedRole);

    const handleRoleChanged = () => {
      const updatedRole = (localStorage.getItem('naam_active_role') as UserRole) || 'admin';
      setRole(updatedRole);
      fetchProducts();
    };

    window.addEventListener('naam_role_changed', handleRoleChanged);
    fetchProducts();

    return () => {
      window.removeEventListener('naam_role_changed', handleRoleChanged);
    };
  }, []);

  const fetchProducts = async () => {
    const data = await DataService.getProducts();
    setProducts(data);
  };

  const resetForm = () => {
    setName('');
    setSku('');
    setCategory('Apparel');
    setSellingPrice(0);
    setCostPrice(0);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.createProduct({
        name,
        sku,
        category,
        default_selling_price: sellingPrice,
        default_cost_price: costPrice,
        is_active: true,
      });
      showToast(`Product ${name} added!`, 'success');
      setIsAddModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      showToast('Error adding product', 'error');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await DataService.updateProduct(editingProduct.id, {
        name,
        sku,
        category,
        default_selling_price: sellingPrice,
        default_cost_price: costPrice,
      });
      showToast(`Product ${name} updated! (Historical orders remain unchanged)`, 'success');
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      showToast('Error updating product', 'error');
    }
  };

  const handleSoftDeleteProduct = async () => {
    if (!deletingProduct) return;
    await DataService.deleteProduct(deletingProduct.id);
    showToast(`Product ${deletingProduct.name} archived cleanly`, 'success');
    setDeletingProduct(null);
    fetchProducts();
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku || '');
    setCategory(p.category || 'General');
    setSellingPrice(p.default_selling_price);
    setCostPrice(p.default_cost_price);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Product / Item Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">Preset items for fast order item entry</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Product Name, SKU..."
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Default Selling Price</th>
              {role !== 'staff' && <th className="py-3 px-4 text-right text-amber-500">Default Cost Price</th>}
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={role !== 'staff' ? 6 : 5} className="py-12 text-center text-slate-500 font-medium">
                  <div className="space-y-2">
                    <PackageSearch className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No catalog products found</p>
                    <p className="text-[11px] text-slate-500">Add catalog products to speed up order entry.</p>
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setIsAddModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-xs mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{p.sku || '-'}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-slate-100">{p.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{p.category}</td>
                  <td className="py-3.5 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(p.default_selling_price)}
                  </td>
                  {role !== 'staff' && (
                    <td className="py-3.5 px-4 text-right font-bold text-amber-500">
                      {formatCurrency(p.default_cost_price)}
                    </td>
                  )}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingProduct(p)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                        title="Archive Product"
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

      {/* CREATE PRODUCT MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Catalog Product">
        <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">SKU Code</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Selling Price *</label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-indigo-600"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Cost Price *</label>
              <input
                type="number"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-amber-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md">
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT PRODUCT MODAL */}
      <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} title="Edit Catalog Product">
        <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">SKU Code</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Selling Price *</label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-indigo-600"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Cost Price *</label>
              <input
                type="number"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-amber-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md">
              Update Product
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE PRODUCT CONFIRMATION */}
      <DeleteConfirmModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleSoftDeleteProduct}
        title="Archive Product"
        message={`Are you sure you want to archive product ${deletingProduct?.name}? Historical orders containing this product will remain completely unchanged.`}
      />
    </div>
  );
}
