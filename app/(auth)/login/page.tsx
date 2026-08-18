'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('minsu.kim@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.login(email);
      router.push('/dashboard');
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border border-slate-200 p-8 space-y-6 shadow-float rounded-3xl">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              DermaTrace <span className="text-brand-600 font-bold">AI</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">돌아오신 것을 환영합니다</h2>
          <p className="text-xs text-slate-500">내 피부 관리의 지속적인 여정을 이어가세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이메일 주소"
            type="email"
            placeholder="example@dermatrace.ai"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="비밀번호"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full font-bold gap-2 py-3" isLoading={isLoading}>
            <span>로그인하기</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="relative flex items-center justify-center border-t border-slate-200 pt-4">
          <span className="bg-white px-3 text-[11px] text-slate-400 font-medium">소셜 계정으로 시작</span>
        </div>

        <Button
          variant="outline"
          className="w-full text-xs font-semibold gap-2 py-2.5 bg-white border-slate-200 text-slate-700"
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => router.push('/dashboard'), 400);
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Google 계정으로 계속하기
        </Button>

        <div className="text-center text-xs text-slate-500 pt-2">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-brand-600 font-bold hover:underline">
            회원가입
          </Link>
        </div>
      </Card>
    </div>
  );
}
