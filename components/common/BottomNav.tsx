'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { primaryNavItems } from './nav-config';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-stretch justify-around"
      aria-label="주요 메뉴"
    >
      {primaryNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center w-full min-h-[48px] py-1 rounded-xl transition-colors',
              isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-700'
            )}
          >
            <Icon className="w-5 h-5 mb-0.5" strokeWidth={isActive ? 2.4 : 2} />
            <span className={cn('text-[10px] tracking-tight', isActive && 'font-bold')}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
