'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkle, Stethoscope, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth';
import { DEMO_ACCOUNTS } from '@/lib/demo-accounts';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (mail: string, pw: string) => {
    setError('');
    setIsLoading(true);
    try {
      const { isClinic } = await authService.login(mail, pw);
      router.push(isClinic ? '/clinic' : '/today');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white">
          <Sparkle className="w-5 h-5" />
        </div>
        <span className="font-extrabold text-lg tracking-tight">AfterGlow</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6">
        <h1 className="text-xl font-extrabold tracking-tight">로그인</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">회복 기록을 이어서 확인하세요.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.includes('@')) {
              setError('이메일 형식을 확인해 주세요.');
              return;
            }
            signIn(email, password);
          }}
          className="space-y-4"
        >
          <Input
            label="이메일"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-xs text-red-500 font-medium">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            로그인
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-5">
          아직 계정이 없나요?{' '}
          <Link href="/signup" className="font-semibold text-brand-700">
            회원가입
          </Link>
        </p>
      </div>

      {/* 심사·시연용 바로 진입. 클릭 한 번으로 두 관점을 모두 볼 수 있게 한다. */}
      <div className="w-full max-w-sm mt-4">
        <p className="text-[11px] font-semibold text-slate-400 text-center mb-2">
          심사용 시연 계정
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => signIn(DEMO_ACCOUNTS.user.email, DEMO_ACCOUNTS.user.password)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-200 hover:border-brand-300 transition-colors disabled:opacity-50 min-h-[76px]"
          >
            <UserIcon className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold text-slate-800">사용자로 보기</span>
            <span className="text-[10px] text-slate-400">{DEMO_ACCOUNTS.user.email}</span>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => signIn(DEMO_ACCOUNTS.clinic.email, DEMO_ACCOUNTS.clinic.password)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-200 hover:border-accent-300 transition-colors disabled:opacity-50 min-h-[76px]"
          >
            <Stethoscope className="w-4 h-4 text-accent-600" />
            <span className="text-xs font-bold text-slate-800">클리닉으로 보기</span>
            <span className="text-[10px] text-slate-400">{DEMO_ACCOUNTS.clinic.email}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
