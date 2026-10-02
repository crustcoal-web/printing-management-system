'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Search, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { Product, Customer, OrderItem, PaymentMethod } from '@/lib/types';
import { calculateOrderFinancials, formatCurrency } from '@/lib/calculations/financials';
import { useToast } from '@/components/ui/Toast';

export default function NewOrderPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // PRODUCTS & CUSTOMERS PRESET LISTS
  const [products, setProducts] = useState<Product[]>([]);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);

  // CUSTOMER FORM STATE
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('Lahore');

  // ITEMS LIST STATE
  const [items, setItems] = useState<
    Array<{
      product_id?: string;
      item_name: string;
      customization_details: string;
      quantity: number;
      selling_price: number;
      cost_price: number;
    }>
  >([
    {
      item_name: 'Custom Ceramic Mug 11oz',
      customization_details: '',
      quantity: 1,
      selling_price: 850,
      cost_price: 350,
    },
  ]);

  // PRICING & DELIVERY STATE
  const [discount, setDiscount] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(250);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(180);
  const [otherInternalCost, setOtherInternalCost] = useState(0);

  // ADVANCE PAYMENT STATE
  const [advancePayment, setAdvancePayment] = useState(0);
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState<PaymentMethod>('jazzcash');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [overpaymentWarning, setOverpaymentWarning] = useState<string | null>(null);

  useEffect(() => {
    DataService.getProducts().then(setProducts);
  }, []);

  // AUTO-SEARCH EXISTING CUSTOMER BY PHONE
  const handlePhoneSearch = async (val: string) => {
    setPhoneSearch(val);
    setCustomerPhone(val);
    if (val.length >= 7) {
      const match = await DataService.getCustomerByPhone(val);
      if (match) {
        setExistingCustomer(match);
        setCustomerName(match.name);
        setCustomerWhatsapp(match.whatsapp || val);
        setCustomerAddress(match.address);
        setCustomerCity(match.city);
        showToast(`Existing Customer Found: ${match.name}`, 'info');
      } else {
        setExistingCustomer(null);
      }
    }
  };

  // ADD ITEM ROW
  const addItemRow = () => {
    setItems([
      ...items,
      {
        item_name: '',
        customization_details: '',
        quantity: 1,
        selling_price: 0,
        cost_price: 0,
      },
    ]);
  };

  // REMOVE ITEM ROW
  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // SELECT PRODUCT FOR ITEM ROW
  const handleSelectProduct = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product_id: prod.id,
      item_name: prod.name,
      selling_price: prod.default_selling_price,
      cost_price: prod.default_cost_price,
    };
    setItems(newItems);
  };

  // CALCULATE TOTALS LIVE
  const financials = calculateOrderFinancials({
    items,
    discount,
    delivery_charges: deliveryCharges,
    additional_charges: additionalCharges,
    delivery_cost: deliveryCost,
    other_internal_cost: otherInternalCost,
    payments: advancePayment ? [{ amount: advancePayment }] : [],
  });

  // OVERPAYMENT CHECK (REQUIREMENT 6)
  useEffect(() => {
    if (advancePayment > financials.total_amount && financials.total_amount > 0) {
      const excess = advancePayment - financials.total_amount;
      setOverpaymentWarning(
        `Payment exceeds total order balance by ${formatCurrency(excess)}.`
      );
    } else {
      setOverpaymentWarning(null);
    }
  }, [advancePayment, financials.total_amount]);

  // SAVE ORDER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      showToast('Please fill in required customer details', 'error');
      return;
    }
    if (items.length === 0 || !items[0].item_name) {
      showToast('Please add at least one order item', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1. Create customer record if new
      let customerId = existingCustomer?.id;
      if (!customerId) {
        const newCust = await DataService.createCustomer({
          name: customerName,
          phone: customerPhone,
          whatsapp: customerWhatsapp,
          address: customerAddress,
          city: customerCity,
        });
        customerId = newCust.id;
      }

      // 2. Format order items snapshots
      const formattedItems: OrderItem[] = items.map((item) => {
        const qty = Math.max(1, item.quantity || 1);
        const sell = item.selling_price || 0;
        const cost = item.cost_price || 0;
        return {
          product_id: item.product_id,
          item_name: item.item_name,
          customization_details: item.customization_details,
          quantity: qty,
          selling_price: sell,
          cost_price: cost,
          selling_total: Number((qty * sell).toFixed(2)),
          cost_total: Number((qty * cost).toFixed(2)),
        };
      });

      // 3. Save Order
      const newOrder = await DataService.createOrder({
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_whatsapp: customerWhatsapp,
        customer_address: customerAddress,
        customer_city: customerCity,
        status: 'new',
        subtotal: financials.subtotal,
        discount,
        delivery_charges: deliveryCharges,
        additional_charges: additionalCharges,
        total_amount: financials.total_amount,
        product_cost: financials.product_cost,
        delivery_cost: deliveryCost,
        other_internal_cost: otherInternalCost,
        total_cost: financials.total_cost,
        profit: financials.profit,
        total_paid: financials.total_paid,
        remaining_amount: financials.remaining_amount,
        cod_amount: financials.cod_amount,
        payment_status: financials.payment_status,
        notes,
        internal_notes: internalNotes,
        order_items: formattedItems,
        advancePayment: advancePayment > 0 ? advancePayment : undefined,
        advancePaymentMethod: advancePayment > 0 ? advancePaymentMethod : undefined,
      } as any);

      showToast(`Order ${newOrder.order_number} Created Successfully!`, 'success');
      router.push(`/orders/${newOrder.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Create New Order</h1>
            <p className="text-xs text-slate-500">NAAM Studio Print Order Form</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: CUSTOMER DETAILS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
            1. Customer Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number (Auto Lookup) *
              </label>
              <input
                type="text"
                required
                value={phoneSearch}
                onChange={(e) => handlePhoneSearch(e.target.value)}
                placeholder="03001234567"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={customerWhatsapp}
                onChange={(e) => setCustomerWhatsapp(e.target.value)}
                placeholder="03001234567"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Delivery Address *
              </label>
              <input
                type="text"
                required
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="House, Street, Area"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="Lahore"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ORDER ITEMS LIST */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              2. Order Items & Customization
            </h2>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* PRESET CATALOG SELECTION */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Product Name / Catalog
                    </label>
                    <select
                      value={item.product_id || ''}
                      onChange={(e) => handleSelectProduct(idx, e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                    >
                      <option value="">-- Select or type custom item --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.default_selling_price)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ITEM NAME TEXT */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.item_name}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].item_name = e.target.value;
                        setItems(newItems);
                      }}
                      placeholder="Item Title"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                    />
                  </div>

                  {/* QUANTITY */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Qty *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                        setItems(newItems);
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </div>

                  {/* REMOVE BUTTON */}
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length <= 1}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1">
                  {/* CUSTOMIZATION DETAILS */}
                  <div className="md:col-span-6">
                    <input
                      type="text"
                      value={item.customization_details}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].customization_details = e.target.value;
                        setItems(newItems);
                      }}
                      placeholder="Customization notes (e.g. Size L, Color Black, Text: Happy Birthday)"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  {/* SELLING PRICE */}
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-400 font-bold">Sell Price:</span>
                      <input
                        type="number"
                        min="0"
                        value={item.selling_price}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].selling_price = parseFloat(e.target.value) || 0;
                          setItems(newItems);
                        }}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* INTERNAL COST PRICE */}
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-400 font-bold">Cost Price:</span>
                      <input
                        type="number"
                        min="0"
                        value={item.cost_price}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].cost_price = parseFloat(e.target.value) || 0;
                          setItems(newItems);
                        }}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-amber-600 dark:text-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: FINANCIALS, DELIVERY & ADVANCE PAYMENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              3. Pricing, Delivery & Costs
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600 dark:text-slate-400">Products Subtotal:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(financials.subtotal)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Discount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Delivery Charge (Customer)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryCharges}
                    onChange={(e) => setDeliveryCharges(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Delivery Cost (Internal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryCost}
                    onChange={(e) => setDeliveryCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Other Internal Cost
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={otherInternalCost}
                    onChange={(e) => setOtherInternalCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-amber-600"
                  />
                </div>
              </div>

              {/* CALCULATION PREVIEW */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl space-y-2 mt-4 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between font-black text-sm">
                  <span>Final Order Total:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(financials.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400 font-bold">
                  <span>Total Internal Cost:</span>
                  <span>{formatCurrency(financials.total_cost)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-black">
                  <span>Estimated Net Profit:</span>
                  <span>{formatCurrency(financials.profit)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              4. Advance Payment & COD
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Advance Payment Received
                </label>
                <input
                  type="number"
                  min="0"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {overpaymentWarning && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{overpaymentWarning}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={advancePaymentMethod}
                  onChange={(e) => setAdvancePaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="jazzcash">JazzCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="easypaisa">Easypaisa</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="cod">COD</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Remaining Balance:</span>
                  <span>{formatCurrency(financials.remaining_amount)}</span>
                </div>
                <div className="flex justify-between font-black text-rose-600 dark:text-rose-400">
                  <span>COD Amount at Delivery:</span>
                  <span>{formatCurrency(financials.cod_amount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Parcel Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions for customer or rider..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating Order...' : 'Save Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
