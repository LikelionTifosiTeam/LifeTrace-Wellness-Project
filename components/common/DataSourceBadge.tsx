'use client';

import React from 'react';
import { Database, FlaskConical } from 'lucide-react';
import { dataSource } from '@/lib/env';

/**
 * 지금 어떤 데이터로 돌고 있는지 화면에 정직하게 표시한다.
 * 데모 중 "이거 실제 데이터인가요?" 질문을 없애고, 키 교체 여부도 한눈에 확인된다.
 */
export const DataSourceBadge: React.FC = () => {
  const isMock = dataSource === 'mock';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
        isMock
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`}
      title={
        isMock
          ? '목데이터로 동작 중입니다. .env.local의 Supabase 키를 실제 값으로 교체하면 자동으로 전환됩니다.'
          : 'Supabase에 연결되어 있습니다.'
      }
    >
      {isMock ? <FlaskConical className="w-3 h-3" /> : <Database className="w-3 h-3" />}
      {isMock ? '데모 데이터' : 'Supabase 연결됨'}
    </div>
  );
};
