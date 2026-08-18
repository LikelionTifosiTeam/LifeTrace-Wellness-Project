'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('2002');
  const [gender, setGender] = useState('male');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.signup({
        email,
        name,
        birthYear: parseInt(birthYear, 10),
        gender: gender as any,
      });
      router.push('/onboarding');
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-lg bg-white border border-slate-200 p-8 space-y-6 shadow-float rounded-3xl">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              DermaTrace <span className="text-brand-600 font-bold">AI</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">회원가입</h2>
          <p className="text-xs text-slate-500">나만의 피부 관리 이력을 체계적으로 관리해보세요</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="비밀번호"
              type="password"
              placeholder="8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="비밀번호 확인"
              type="password"
              placeholder="비밀번호 재입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="이름"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="출생 연도"
              type="number"
              placeholder="2002"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">성별 (선택)</label>
              <select
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
                <option value="prefer_not_to_say">선택 안 함</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full font-bold gap-2 py-3 mt-2" isLoading={isLoading}>
            <span>가입하고 피부 프로필 생성하기</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-brand-600 font-bold hover:underline">
            로그인
          </Link>
        </div>
      </Card>
    </div>
  );
}
