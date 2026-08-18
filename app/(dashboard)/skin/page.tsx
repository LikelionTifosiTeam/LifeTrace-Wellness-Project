'use client';

import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  TrendingUp,
  Brain,
  ShieldAlert,
  Calendar,
  PieChart as PieIcon
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/states/Skeleton';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { SkinTrendChart } from '@/features/dashboard/SkinTrendChart';
import { SkinPattern } from '@/types';
import { skinService } from '@/services/skin';
import { mockDashboardData } from '@/mock/data';

export default function MySkinPage() {
  const [patterns, setPatterns] = useState<SkinPattern[]>([]);
  const [period, setPeriod] = useState<'30' | '90' | '365'>('30');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    skinService.getSkinPatterns().then((res) => {
      setPatterns(res);
      setIsLoading(false);
    });
  }, []);

  return (
    <MainShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Badge variant="brand">MY SKIN PROFILE & PATTERNS</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Skin</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            나의 피부 프로필, 장기 트렌드 변화 및 AI 상관관계 분석 패턴을 종합 관리합니다.
          </p>
        </div>

        {/* Current Concerns Header Card */}
        <Card className="p-6 bg-white border-slate-200 space-y-4 rounded-3xl shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">현재 집중 관리 피부 고민</h3>
            <span className="text-xs text-slate-400 font-medium">프로필 기준</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 flex-1 min-w-[140px] space-y-1">
              <span className="text-xs font-bold text-brand-800">여드름 (Primary)</span>
              <p className="text-[11px] text-brand-600">활성 염증 및 피지 지수 관리</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex-1 min-w-[140px] space-y-1">
              <span className="text-xs font-bold text-amber-800">붉은기 (Secondary)</span>
              <p className="text-[11px] text-amber-600">진정 및 홍조 모니터링</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex-1 min-w-[140px] space-y-1">
              <span className="text-xs font-bold text-emerald-800">피부결 (Secondary)</span>
              <p className="text-[11px] text-emerald-600">각질 스케일링 유지</p>
            </div>
          </div>
        </Card>

        {/* Skin Trend with Period Switcher */}
        <Card className="p-6 bg-white border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Skin Trend (장기 피부 수치 변화)</h3>
              <p className="text-xs text-slate-500">기간별 종합 점수와 세부 수치 변동성을 시각화합니다.</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['30', '90', '365'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    period === p ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p === '365' ? '1년' : `${p}일`}
                </button>
              ))}
            </div>
          </div>

          <SkinTrendChart data={mockDashboardData.recentSkinTrend} />
        </Card>

        {/* AI Skin Patterns Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">AI가 발견한 개인 피부 패턴 (Skin Pattern)</h2>
            </div>
            <span className="text-xs text-slate-400">상관관계 기반 참고 정보</span>
          </div>

          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {patterns.map((pat) => (
                <Card key={pat.id} className="p-6 bg-white border-slate-200 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="brand">영향도 {pat.impactLevel}</Badge>
                      <ShieldAlert className="w-4 h-4 text-brand-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{pat.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{pat.correlationDescription}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                    {pat.disclaimer}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Treatment Summary Breakdown */}
        <Card className="p-6 bg-white border-slate-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieIcon className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Treatment Summary (경험한 관리 비중)</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
              <span className="text-xs font-bold text-slate-700">여드름 관련</span>
              <div className="text-xl font-black text-brand-600">45%</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
              <span className="text-xs font-bold text-slate-700">피부결 스케일링</span>
              <div className="text-xl font-black text-accent-600">25%</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
              <span className="text-xs font-bold text-slate-700">색소 케어</span>
              <div className="text-xl font-black text-emerald-600">20%</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
              <span className="text-xs font-bold text-slate-700">기타 관리</span>
              <div className="text-xl font-black text-amber-600">10%</div>
            </div>
          </div>
        </Card>

        <MedicalDisclaimer />
      </div>
    </MainShell>
  );
}
