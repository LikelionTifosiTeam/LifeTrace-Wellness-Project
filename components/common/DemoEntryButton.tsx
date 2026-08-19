'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { session } from '@/services/session';

/**
 * 랜딩의 '데모 둘러보기'.
 *
 * 온보딩으로 자기 여정을 시작한 뒤에도 데모 시나리오를 다시 볼 수 있어야 한다.
 * (심사/시연 중 앞뒤로 오가며 확인하게 된다.)
 */
export const DemoEntryButton: React.FC = () => {
  const router = useRouter();

  return (
    <Button
      size="lg"
      variant="outline"
      className="w-full sm:w-auto"
      onClick={() => {
        session.resetToDemo();
        router.push('/today');
      }}
    >
      데모 둘러보기
    </Button>
  );
};
