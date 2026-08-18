'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight, ArrowDownRight, Clock, PlusCircle } from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/states/Skeleton';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { SkinAnalysis } from '@/types';
import { analysisService } from '@/services/analysis';

export default function AnalysisOverviewPage() {
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    analysisService.getAllAnalyses().then((res) => {
      setAnalyses(res);
      setIsLoading(false);
    });
  }, []);

  return (
    <MainShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="brand">AI SKIN ANALYSIS</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">내 피부 분석</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              최근 피부 상태와 기록을 기반으로 현재 피부 고민의 수치적 변화를 확인해보세요.
            </p>
          </div>

          <Link href="/analysis/new">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white font-bold gap-2 shadow-sm">
              <PlusCircle className="w-4 h-4" />
              <span>새 피부 분석 시작하기</span>
            </Button>
          </Link>
        </div>

        {/* Current Score Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-4 bg-white border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">여드름 (Acne)</span>
              <span className="inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3 h-3" /> 12%
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">68점</div>
            <p className="text-[10px] text-slate-400">턱 주변 구반포 형태</p>
          </Card>

          <Card className="p-4 bg-white border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">붉은기 (Redness)</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowDownRight className="w-3 h-3" /> 5%
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">52점</div>
            <p className="text-[10px] text-slate-400">양 뺨 홍조 개선 중</p>
          </Card>

          <Card className="p-4 bg-white border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">피부결 (Texture)</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3 h-3" /> 8%
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">74점</div>
            <p className="text-[10px] text-slate-400">스케일링 효과 유지</p>
          </Card>

          <Card className="p-4 bg-white border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">건조함 (Dryness)</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowDownRight className="w-3 h-3" /> 2%
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">45점</div>
            <p className="text-[10px] text-slate-400">유수분 균형 양호</p>
          </Card>

          <Card className="p-4 bg-white border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">유분 (Oiliness)</span>
              <span className="inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3 h-3" /> 4%
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">55점</div>
            <p className="text-[10px] text-slate-400">T존 모공 지수</p>
          </Card>
        </div>

        {/* Latest AI Insight Card */}
        <Card className="p-6 bg-gradient-to-r from-brand-50 via-white to-accent-50/40 border-brand-200 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-extrabold text-brand-900">Latest AI Insight Summary</h3>
          </div>
          <p className="text-sm font-bold text-slate-900">
            "최근 7일 간 턱 주변 트러블 관련 기록 수치가 지속 증가했습니다."
          </p>
          <p className="text-xs text-slate-600">
            평균 수면 시간 감소 및 스트레스 자극이 피부 진정 재생 주기에 미치는 연관성이 탐색되었습니다.
          </p>
        </Card>

        {/* Analysis History */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">피부 분석 이력 (Analysis History)</h2>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((item) => (
                <Card key={item.id} hoverEffect className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                      <Clock className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.date} AI 분석</span>
                        <Badge variant="brand">{item.mainConcern}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.recommendationGuide}</p>
                    </div>
                  </div>

                  <Link href={`/analysis/result?id=${item.id}`}>
                    <Button size="sm" variant="outline" className="text-xs font-bold gap-1">
                      <span>결과 보기</span>
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>

        <MedicalDisclaimer />
      </div>
    </MainShell>
  );
}
