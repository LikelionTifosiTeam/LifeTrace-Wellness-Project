'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Sparkles, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left Title / Breadcrumb context */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-800 hidden sm:block">
          DermaTrace <span className="text-brand-600">AI Care Platform</span>
        </h2>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center gap-3 ml-auto">
        <Link href="/analysis/new">
          <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI 피부 분석</span>
            <span className="sm:hidden">분석</span>
          </Button>
        </Link>

        <Link href="/history">
          <Button size="sm" variant="outline" className="gap-1.5 hidden md:inline-flex text-xs">
            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>기록 추가</span>
          </Button>
        </Link>

        <button
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition-colors"
          aria-label="알림"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
};
