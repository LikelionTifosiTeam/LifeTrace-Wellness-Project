'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export interface MainShellProps {
  children: React.ReactNode;
}

export const MainShell: React.FC<MainShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50/70 flex text-slate-900">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
