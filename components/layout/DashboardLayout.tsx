'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserRole } from '@/lib/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load active role from localStorage for testing role restrictions
  useEffect(() => {
    const savedRole = localStorage.getItem('naam_active_role') as UserRole;
    if (savedRole && ['admin', 'manager', 'staff'].includes(savedRole)) {
      setRole(savedRole);
    }
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('naam_active_role', newRole);
    window.dispatchEvent(new Event('naam_role_changed'));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased overflow-x-hidden">
      {/* SIDEBAR NAVIGATION (DESKTOP & MOBILE DRAWER) */}
      <Sidebar
        role={role}
        onRoleChange={handleRoleChange}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden w-full">
        <Header
          role={role}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
