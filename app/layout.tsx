import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DermaTrace AI - 내 피부의 변화부터, 나에게 맞는 관리의 다음 단계까지',
  description: '피부 상태부터 치료 이력까지, 흩어진 정보를 하나로 연결해 나만의 피부 관리 여정을 만들어보세요.',
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
