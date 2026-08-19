import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mb-4">
        <Compass className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
        없는 페이지예요
      </h1>
      <p className="text-sm text-slate-500 mt-2">주소를 다시 확인해 주세요.</p>
      <Link href="/today" className="mt-6">
        <Button>오늘 화면으로</Button>
      </Link>
    </div>
  );
}
