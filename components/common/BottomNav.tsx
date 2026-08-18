'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Building2, History, User } from 'lucide-react';

const mobileNavItems = [
  { name: '홈', href: '/dashboard', icon: Home },
  { name: '분석', href: '/analysis', icon: Sparkles },
  { name: '병원', href: '/hospitals', icon: Building2 },
  { name: '기록', href: '/history', icon: History },
  { name: '프로필', href: '/profile', icon: User },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all ${
              isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
            <span className="text-[10px] tracking-tight">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};
