import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AfterGlow — 시술 후 90일, 회복을 혼자 견디지 않도록',
  description: '시술 다음 날부터 90일. 하루 30초 기록으로 회복 곡선을 따라가고, 매일 새로 쓰이는 케어 카드를 받아보세요.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0d9488',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
