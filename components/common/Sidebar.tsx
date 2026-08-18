'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  UserCheck,
  Building2,
  History,
  Lightbulb,
  User,
  Settings,
  LogOut,
  Activity
} from 'lucide-react';

const navItems = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '피부 분석', href: '/analysis', icon: Sparkles },
  { name: 'My Skin', href: '/skin', icon: UserCheck },
  { name: '병원 찾기', href: '/hospitals', icon: Building2 },
  { name: '치료 이력', href: '/history', icon: History },
  { name: 'AI 인사이트', href: '/insights', icon: Lightbulb },
  { name: '프로필', href: '/profile', icon: User },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 h-screen sticky top-0 shrink-0 z-30">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white shadow-sm">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
            DermaTrace <span className="text-brand-600 font-bold">AI</span>
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">개인 맞춤 피부 관리 SaaS</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Actions */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>설정</span>
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>로그아웃</span>
        </Link>

        {/* User Card */}
        <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-200">
            민수
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">김민수 님</p>
            <p className="text-[10px] text-slate-500 truncate">minsu.kim@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
