'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Sparkle } from 'lucide-react';

export interface HeaderProps {
  /** 오늘 화면 상단에 D+N을 크게 보여주기 위해 페이지가 넘겨준다 */
  title?: string;
  subtitle?: string;
  hasAlert?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, hasAlert = false }) => {
  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/70">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link href="/today" className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white">
            <Sparkle className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight">AfterGlow</span>
        </Link>

        <div className="hidden lg:block min-w-0">
          {title && <p className="text-sm font-bold text-slate-900 truncate">{title}</p>}
          {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
        </div>

        <Link
          href="/recovery#alerts"
          className="relative p-2 -mr-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label={hasAlert ? '확인이 필요한 알림 있음' : '알림'}
        >
          <Bell className="w-5 h-5" />
          {hasAlert && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </Link>
      </div>
    </header>
  );
};
