'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export interface MainShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  hasAlert?: boolean;
}

export const MainShell: React.FC<MainShellProps> = ({
  children,
  title,
  subtitle,
  hasAlert,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} hasAlert={hasAlert} />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-28 lg:pb-10">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
