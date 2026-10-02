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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar role={role} onRoleChange={handleRoleChange} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header role={role} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
