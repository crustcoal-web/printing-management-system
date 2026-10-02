'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Settings, Save, Upload, Database, FileText } from 'lucide-react';
import { DataService } from '@/lib/services/data-service';
import { BusinessSettings } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  const [businessName, setBusinessName] = useState('NAAM Studio');
  const [logoUrl, setLogoUrl] = useState('/images/logo.png');
  const [phone, setPhone] = useState('0300-1234567');
  const [whatsapp, setWhatsapp] = useState('0300-1234567');
  const [email, setEmail] = useState('info@naamstudio.com');
  const [address, setAddress] = useState('Main Boulevard, Gulberg III, Lahore');
  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const [orderPrefix, setOrderPrefix] = useState('ORD-');
  const [defaultDeliveryCharge, setDefaultDeliveryCharge] = useState(250);

  useEffect(() => {
    DataService.getSettings().then((s) => {
      setSettings(s);
      setBusinessName(s.business_name || 'NAAM Studio');
      setLogoUrl(s.logo_url || '/images/logo.png');
      setPhone(s.phone);
      setWhatsapp(s.whatsapp);
      setEmail(s.email);
      setAddress(s.address);
      setCurrencySymbol(s.currency_symbol);
      setOrderPrefix(s.order_prefix);
      setDefaultDeliveryCharge(s.default_delivery_charge);
    });
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await DataService.updateSettings({
        business_name: businessName,
        logo_url: logoUrl,
        phone,
        whatsapp,
        email,
        address,
        currency_symbol: currencySymbol,
        order_prefix: orderPrefix,
        default_delivery_charge: defaultDeliveryCharge,
      });
      setSettings(updated);
      showToast('NAAM Studio Settings saved successfully!', 'success');
    } catch (err: any) {
      showToast('Error saving settings', 'error');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      showToast('Logo image selected! Save settings to apply', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Business Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">NAAM Studio business branding, currency & parcel defaults</p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* BUSINESS BRANDING SECTION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
            Business Branding
          </h2>

          {/* LOGO DISPLAY & UPLOAD */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative w-36 h-14 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center p-2 shrink-0">
              <Image src={logoUrl} alt="NAAM Studio Logo" fill className="object-contain" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Official NAAM Studio Logo
              </label>
              <p className="text-[11px] text-slate-500">
                Used on Order Slips, Login, Sidebar, Header, and Customer Documents.
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-800 mt-1">
                <Upload className="w-3.5 h-3.5" /> Replace Logo
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold mb-1">Business Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
          </div>
        </div>

        {/* SYSTEM DEFAULTS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
            System Defaults & Order Prefix
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Order Prefix</label>
              <input
                type="text"
                value={orderPrefix}
                onChange={(e) => setOrderPrefix(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Default Delivery Charge</label>
              <input
                type="number"
                value={defaultDeliveryCharge}
                onChange={(e) => setDefaultDeliveryCharge(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Business Settings
          </button>
        </div>
      </form>
    </div>
  );
}
