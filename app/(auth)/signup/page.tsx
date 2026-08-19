'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; form?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = '이름을 입력해 주세요.';
    if (!email.includes('@')) next.email = '이메일 형식을 확인해 주세요.';
    if (password.length < 6) next.form = '비밀번호는 6자 이상이어야 합니다.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsLoading(true);
    try {
      await authService.signup({ name, email, password });
      router.push('/onboarding');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : '회원가입에 실패했습니다.' });
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
        <h1 className="text-xl font-extrabold tracking-tight">회복을 혼자 견디지 않도록</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          다음 단계에서 시술 정보를 등록하면 회복 곡선이 그려집니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            label="이메일"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.form && (
            <p className="text-xs text-red-500 font-medium" role="alert">
              {errors.form}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            다음
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-5">
          이미 계정이 있나요?{' '}
          <Link href="/login" className="font-semibold text-brand-700">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
