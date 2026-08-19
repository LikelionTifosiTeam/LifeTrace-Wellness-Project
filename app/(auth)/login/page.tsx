'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@afterglow.kr');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('이메일 형식을 확인해 주세요.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authService.login(email, password);
      router.push('/today');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      );
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
        <h1 className="text-xl font-extrabold tracking-tight">다시 오셨네요</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">회복 기록을 이어서 확인하세요.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이메일"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <Input
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            placeholder="데모에서는 아무 값이나 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
    </div>
  );
}
