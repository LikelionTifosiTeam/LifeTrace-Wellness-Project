'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Activity,
  ShieldCheck,
  Search,
  CalendarCheck,
  TrendingUp,
  Brain,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900">
            DermaTrace <span className="text-brand-600 font-bold">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-semibold text-slate-700">
              로그인
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold">
              시작하기
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 lg:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <Badge variant="brand" className="px-3 py-1 text-xs gap-1.5 font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> 개인화 피부 관리 AI 플랫폼
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.25]">
            내 피부의 변화부터,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-teal-600 to-accent-600">
              나에게 맞는 관리의 다음 단계까지
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
            피부 상태부터 치료 이력까지, 흩어진 정보를 하나로 연결해 나만의 피부 관리 여정을 만들어보세요.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/onboarding">
              <Button size="lg" className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md gap-2">
                <span>내 피부 분석 시작하기</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="font-semibold text-slate-700 bg-white">
                서비스 둘러보기
              </Button>
            </Link>
          </div>

          <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>전문의 진료 연결</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>치료 타임라인 추적</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>데이터 비보호 안심 관리</span>
            </div>
          </div>
        </div>

        {/* Hero Right: AI Skin Analysis UI Mockup */}
        <div className="lg:col-span-5 relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-500 to-accent-500 opacity-20 blur-xl"></div>
          <Card className="relative bg-white border border-slate-200/90 shadow-xl rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                <span className="text-xs font-bold text-slate-800">Skin Condition Summary</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">실시간 AI 파악</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">여드름 (Acne)</span>
                <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">68 / 100</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">붉은기 (Redness)</span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">52 / 100</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">피부결 (Texture)</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">74 / 100</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50/80 border border-brand-100 flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-brand-900">최근 14일 변화 탐색</p>
                <p className="text-[11px] text-brand-700 mt-0.5 leading-snug">
                  "최근 14일 동안 트러블 지수가 18% 증가했습니다. 수면패턴 감소 연관성 관찰."
                </p>
              </div>
            </div>

            <Link href="/analysis/result">
              <Button size="md" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2">
                <span>분석 결과 보기</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Section 2: Why DermaTrace AI */}
      <section className="py-16 bg-white border-y border-slate-200/80 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="brand">WHY DERMATRACE AI</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              한 번 분석하고 끝나는 피부 AI가 아닌,<br />
              사용할수록 나를 이해하는 AI
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hoverEffect className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg border border-brand-100">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">ANALYZE</h3>
              <p className="text-sm font-medium text-slate-800">피부 상태를 이해하고</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                사진 한 장과 생활 기록으로 피부 고민의 변화 수치를 객관적인 데이터로 다차원 분석합니다.
              </p>
            </Card>

            <Card hoverEffect className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center font-black text-lg border border-accent-100">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">GUIDE</h3>
              <p className="text-sm font-medium text-slate-800">다음 관리 방향을 확인하고</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                단정적 진단 대신, 전문 의료진 상담 및 피부과 탐색 등 현실적인 케어 가이드를 제안합니다.
              </p>
            </Card>

            <Card hoverEffect className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg border border-emerald-100">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">LEARN</h3>
              <p className="text-sm font-medium text-slate-800">나의 치료 경험을 학습합니다</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                시술 및 피부과 방문 이력을 기록하면 AI가 나의 반응 패턴을 학습하여 지속 관리 효과를 증대합니다.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3: How It Works */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="accent">HOW IT WORKS</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            5단계로 연결되는 개인화 피부 여정
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: '1', title: '피부 상태 기록', desc: '사진 및 생활 데이터 입력' },
            { step: '2', title: 'AI 상태 분석', desc: '변화율 및 관련 요인 탐색' },
            { step: '3', title: '의료기관 탐색', desc: '내 주변 전문 피부과 연결' },
            { step: '4', title: '치료 이력 기록', desc: '방문 시술 & 변화 저장' },
            { step: '5', title: '개인화 학습', desc: '나만의 피부 패턴 완성' },
          ].map((item) => (
            <Card key={item.step} className="p-4 text-center space-y-2 relative">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mx-auto">
                {item.step}
              </div>
              <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 4: Timeline Preview */}
      <section className="py-16 bg-slate-100/60 border-t border-slate-200/80 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-slate-900">나의 피부 여정 (Timeline Preview)</h3>
            <p className="text-xs text-slate-500">흩어진 피부 기록을 한 눈에 확인하세요</p>
          </div>

          <div className="space-y-4">
            <Card className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">8월 12일</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">피부 상태 기록</p>
                  <p className="text-xs text-slate-500">여드름 68점 (안정 유지)</p>
                </div>
              </div>
              <Badge variant="neutral">피부 분석</Badge>
            </Card>

            <Card className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-accent-600 bg-accent-50 px-2.5 py-1 rounded-lg">8월 10일</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">더마블라썸 피부과의원 방문</p>
                  <p className="text-xs text-slate-500">여드름 압출 및 진정 레이저 시술</p>
                </div>
              </div>
              <Badge variant="brand">치료 기록</Badge>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 5: Safety & Trust */}
      <section className="py-12 px-6 lg:px-12 max-w-4xl mx-auto w-full">
        <MedicalDisclaimer />
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 py-8 px-6 lg:px-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span className="font-semibold text-slate-700">DermaTrace AI</span>
            <span>© 2026 DermaTrace AI Team. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/privacy" className="hover:text-slate-900">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-slate-900">이용약관</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
