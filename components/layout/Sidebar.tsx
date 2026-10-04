'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  CreditCard,
  Receipt,
  BarChart3,
  FileText,
  Trash2,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import { X } from 'lucide-react';

interface SidebarProps {
  role?: UserRole;
  userEmail?: string;
  userName?: string;
  onRoleChange?: (newRole: UserRole) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role = 'admin',
  userEmail = 'admin@naamstudio.com',
  userName = 'Admin User',
  onRoleChange,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
    { name: 'Orders', href: '/orders', icon: ShoppingBag, roles: ['admin', 'manager', 'staff'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['admin', 'manager', 'staff'] },
    { name: 'Products / Items', href: '/products', icon: Package, roles: ['admin', 'manager', 'staff'] },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['admin', 'manager', 'staff'] },
    { name: 'Expenses', href: '/expenses', icon: Receipt, roles: ['admin', 'manager'] }, // HIDDEN FOR STAFF
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] }, // HIDDEN FOR STAFF
    { name: 'Order Slips', href: '/slips', icon: FileText, roles: ['admin', 'manager', 'staff'] },
    { name: 'Trash / Deleted', href: '/trash', icon: Trash2, roles: ['admin', 'manager', 'staff'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'manager', 'staff'] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* SIDEBAR ASIDE */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col border-r border-slate-800 shrink-0 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* BRAND HEADER WITH NAAM STUDIO LOGO */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
              <Image
                src="/images/logo-icon.png"
                alt="NAAM Studio Icon"
                width={36}
                height={36}
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                NAAM Studio
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400">
                Print Management
              </span>
            </div>
          </div>

          {/* MOBILE CLOSE BUTTON */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* USER ROLE SWITCHER DEMO BANNER */}
        <div className="mx-3 my-3 p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1 font-medium">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Active Role:
            </span>
            <span className="uppercase font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-[10px]">
              {role}
            </span>
          </div>
          {onRoleChange && (
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="admin">Admin (Full Access)</option>
              <option value="manager">Manager (Operations)</option>
              <option value="staff">Staff (No Costs/Profit)</option>
            </select>
          )}
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER USER PROFILE */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="truncate">
            <p className="font-semibold text-slate-200 truncate">{userName}</p>
            <p className="text-slate-500 truncate text-[11px]">{userEmail}</p>
          </div>
        </div>
      </aside>
    </>
  );
};
