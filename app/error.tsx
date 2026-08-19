'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 운영에서는 여기서 에러 리포팅으로 보낸다.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
        <AlertOctagon className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
        화면을 불러오지 못했어요
      </h1>
      <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
        기록은 안전하게 보관되어 있습니다. 다시 시도해도 같은 문제가 생기면 잠시 후 접속해 주세요.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 mt-6">
        <Button onClick={reset}>다시 시도</Button>
        <Link href="/today">
          <Button variant="outline" className="w-full">
            오늘 화면으로
          </Button>
        </Link>
      </div>
    </div>
  );
}
