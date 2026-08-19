'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from './nav-config';
import { DataSourceBadge } from './DataSourceBadge';
import { authService } from '@/services/auth';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    router.push('/');
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200/80 h-screen sticky top-0 shrink-0 z-30">
      <Link href="/today" className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white shadow-sm">
          <Sparkle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
            AfterGlow
          </h1>
          <p className="text-[11px] text-slate-400 mt-1">시술 후 90일 회복 동행</p>
        </div>
      </Link>

      <nav className="flex-1 p-3 space-y-1" aria-label="전체 메뉴">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-2">
        <div className="px-1">
          <DataSourceBadge />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50"
        >
          <LogOut className="w-[18px] h-[18px]" />
          로그아웃
        </button>
      </div>
    </aside>
  );
};
