import { Home, LineChart, HeartPulse, BookMarked, Settings, User } from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: typeof Home;
  /** 하단 탭에 노출할지 여부 */
  primary?: boolean;
}

export const navItems: NavItem[] = [
  { name: '오늘', href: '/today', icon: Home, primary: true },
  { name: '회복', href: '/recovery', icon: LineChart, primary: true },
  { name: '컨디션', href: '/vitals', icon: HeartPulse, primary: true },
  { name: '기록', href: '/journal', icon: BookMarked, primary: true },
  { name: '프로필', href: '/profile', icon: User, primary: true },
  { name: '설정', href: '/settings', icon: Settings },
];

export const primaryNavItems = navItems.filter((i) => i.primary);
