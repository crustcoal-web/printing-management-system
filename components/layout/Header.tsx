'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Bell, LogOut, FileText, Menu } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

interface HeaderProps {
  role?: UserRole;
  userName?: string;
  onSearch?: (query: string) => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  role = 'admin',
  userName = 'Admin User',
  onSearch,
  onOpenMobileMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        router.push(`/orders?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleLogout = () => {
    // Clear session cookie and local state
    document.cookie = 'naam_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('naam_active_role');
    showToast('Logged out of NAAM Studio', 'info');
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs gap-2">
      {/* MOBILE HAMBURGER BUTTON & SEARCH */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-100 hover:bg-slate-800 rounded-lg shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* GLOBAL SEARCH FORM */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, customers..."
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-full pl-9 sm:pl-10 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </form>
      </div>

      {/* QUICK ACTIONS & PROFILE */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* QUICK NEW ORDER BUTTON */}
        <Link
          href="/orders/new"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Order</span>
        </Link>

        {/* QUICK GENERATE SLIPS BUTTON */}
        <Link
          href="/slips"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-500" />
          <span>Slips</span>
        </Link>

        {/* DIVIDER */}
        <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800" />

        {/* USER PROFILE & LOGOUT */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
            {userName.charAt(0)}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              {userName}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">
              {role}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
