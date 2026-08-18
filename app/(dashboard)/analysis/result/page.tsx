'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  TrendingUp,
  Brain,
  Building2,
  BookmarkCheck,
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/states/Skeleton';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { SkinAnalysis, AIFactor } from '@/types';
import { analysisService } from '@/services/analysis';

function ResultContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id') || 'analysis-005';

  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFactor, setSelectedFactor] = useState<AIFactor | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    analysisService.getAnalysisById(id).then((res) => {
      setAnalysis(res || null);
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading || !analysis) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="brand">AI ANALYSIS RESULT</Badge>
            <span className="text-xs text-slate-400 font-medium">{analysis.date} 생성</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">현재 피부 상태 분석 결과</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isSaved ? 'secondary' : 'outline'}
            onClick={() => setIsSaved(true)}
            className="text-xs font-bold gap-1.5"
          >
            <BookmarkCheck className={`w-4 h-4 ${isSaved ? 'text-brand-600' : 'text-slate-400'}`} />
            <span>{isSaved ? '내 피부 기록에 저장됨' : '내 피부 기록에 저장'}</span>
          </Button>
          <Link href="/hospitals">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs gap-1.5 shadow-sm">
              <Building2 className="w-4 h-4" />
              <span>주변 의료기관 찾기</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Mandatory Safety Disclaimer Banner */}
      <MedicalDisclaimer />

      {/* Main Concern Hero Summary */}
      <Card className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-float space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="brand" className="bg-white/10 text-brand-100 border-white/20">
            MAIN CONCERN
          </Badge>
          <span className="text-xs text-brand-200">분석 수치 68%</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-4xl font-black">{analysis.mainConcern} 관련 피부 고민 수치</h2>
          <p className="text-xs sm:text-sm text-brand-100/90 font-medium">
            최근 14일 기록 대비 염증 및 피지 지수가 일시적으로 증가한 양상이 관찰되었습니다.
          </p>
        </div>
      </Card>

      {/* Detected Concerns */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Detected Concerns (감지된 세부 피부 고민)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.detectedConcerns.map((concern) => (
            <Card key={concern.id} className="p-5 space-y-3 bg-white border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{concern.name}</span>
                <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                  {concern.score} / 100
                </span>
              </div>
              <p className="text-xs text-slate-600">{concern.description}</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>변화율:</span>
                <span className={concern.changePercentage > 0 ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>
                  {concern.changePercentage > 0 ? `+${concern.changePercentage}%` : `${concern.changePercentage}%`}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Change Detection & AI WHY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Change Detection */}
        <Card className="lg:col-span-5 p-6 space-y-4 bg-white border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Change Detection ({analysis.changeDetection.period})</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-semibold text-slate-700">트러블 관련 지수</span>
              <span className="font-bold text-red-600">+{analysis.changeDetection.acneChange}%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-semibold text-slate-700">평균 수면 시간</span>
              <span className="font-bold text-amber-600">{analysis.changeDetection.sleepChange}%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-semibold text-slate-700">체감 스트레스 수준</span>
              <span className="font-bold text-red-600">+{analysis.changeDetection.stressChange}%</span>
            </div>
          </div>
        </Card>

        {/* AI WHY Top 3 Factors */}
        <Card className="lg:col-span-7 p-6 space-y-4 bg-white border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">AI WHY (상관 요인 탐색)</h3>
            </div>
            <span className="text-[11px] text-slate-400">카드를 클릭하여 상세 정보 확인</span>
          </div>

          <div className="space-y-3">
            {analysis.topFactors.map((factor, idx) => (
              <button
                key={factor.id}
                type="button"
                onClick={() => setSelectedFactor(factor)}
                className="w-full text-left p-4 rounded-2xl border border-slate-200/80 hover:border-brand-300 hover:bg-brand-50/20 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{factor.name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{factor.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={
                      factor.relevance === '높음'
                        ? 'danger'
                        : factor.relevance === '중간'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    관련도 {factor.relevance}
                  </Badge>
                  <Info className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Guide Recommendation Box */}
      <Card className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-emerald-950">AI 가이드: 권장 다음 단계</h3>
        </div>
        <p className="text-sm font-semibold text-emerald-900 leading-relaxed">
          &quot;{analysis.recommendationGuide}&quot;
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link href="/hospitals">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>주변 피부과 전문의 탐색</span>
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" variant="outline" className="text-xs font-semibold bg-white border-emerald-300 text-emerald-800">
              대시보드로 돌아가기
            </Button>
          </Link>
        </div>
      </Card>

      {/* Interactive AI WHY Factor Modal */}
      <Modal
        isOpen={!!selectedFactor}
        onClose={() => setSelectedFactor(null)}
        title={selectedFactor ? `${selectedFactor.name} 상세 분석` : ''}
      >
        {selectedFactor && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500">관련도 수준</span>
              <Badge variant="brand">{selectedFactor.relevance}</Badge>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{selectedFactor.description}</p>
            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500">
              ※ 이 분석은 입력된 생활 습관 파동과 피부 점수 간의 통계적 패턴 탐색 결과입니다.
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedFactor(null)} className="bg-slate-900 text-white font-bold">
                확인 완료
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AnalysisResultPage() {
  return (
    <MainShell>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ResultContent />
      </Suspense>
    </MainShell>
  );
}
