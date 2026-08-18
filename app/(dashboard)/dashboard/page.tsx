'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  TrendingUp,
  PlusCircle,
  Brain,
  Lightbulb,
  Building2,
  Calendar,
  ChevronRight,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/states/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { SkinTrendChart } from '@/features/dashboard/SkinTrendChart';
import { DashboardData } from '@/types';
import { skinService } from '@/services/skin';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Quick Record Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [recordScore, setRecordScore] = useState<number>(75);
  const [recordNotes, setRecordNotes] = useState<string>('');
  const [isSubmittingRecord, setIsSubmittingRecord] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await skinService.getDashboard();
      setData(res);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRecord(true);
    try {
      await skinService.addSkinLog({
        score: recordScore,
        notes: recordNotes,
      });
      setIsRecordModalOpen(false);
      setRecordNotes('');
      fetchDashboardData();
    } catch {
      setIsSubmittingRecord(false);
    }
  };

  return (
    <MainShell>
      <div className="space-y-8">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                안녕하세요, {data?.user.name || '민수'}님 👋
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">오늘의 피부 상태와 관리 가이드를 확인해 보세요.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsRecordModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>오늘 피부 기록하기</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-44 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
            <Skeleton className="h-72 w-full" />
          </div>
        ) : isError || !data ? (
          <ErrorState onRetry={fetchDashboardData} />
        ) : (
          <>
            {/* Section 1: Hero Today's Skin Status Card */}
            <Card className="bg-gradient-to-br from-brand-700 via-brand-800 to-navy-900 text-white p-6 sm:p-8 rounded-3xl shadow-float relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="brand" className="bg-white/10 text-white border-white/20 text-xs font-medium">
                      TODAY&apos;S SKIN STATUS
                    </Badge>
                    <span className="text-xs text-brand-100/80 font-medium">2026.08.18 업데이트</span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-6xl font-black tracking-tight">{data.todaySkinStatus.score}</span>
                    <span className="text-lg text-brand-100 font-semibold">/ 100 점</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/30">
                      <TrendingUp className="w-3.5 h-3.5" /> +{data.todaySkinStatus.trendPercentage}% 상승
                    </span>
                  </div>

                  <p className="text-sm text-brand-100/90 font-medium">
                    상태: <span className="text-white font-bold">{data.todaySkinStatus.statusText}</span>
                  </p>
                </div>

                <div className="md:col-span-4 flex flex-col justify-end items-start md:items-end gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                  <p className="text-xs text-brand-100/80">일일 기록 작성률 100% 달성</p>
                  <Button
                    onClick={() => setIsRecordModalOpen(true)}
                    className="w-full md:w-auto bg-white hover:bg-brand-50 text-brand-900 font-bold border-0 text-xs py-2.5 shadow-sm"
                  >
                    오늘 피부 상태 기록
                  </Button>
                </div>
              </div>
            </Card>

            {/* Section 2: AI Insight & Today's Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Insight Card */}
              <Card hoverEffect className="p-6 border-brand-100 bg-gradient-to-br from-white to-brand-50/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                      <Brain className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-brand-800">AI Insight Card</span>
                  </div>
                  <Badge variant="brand">상관성 발견</Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{data.aiInsight.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{data.aiInsight.summary}</p>

                <div className="pt-2">
                  <Link href="/insights">
                    <Button size="sm" variant="secondary" className="font-bold gap-1 text-xs">
                      <span>{data.aiInsight.actionText}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Today's Guide Action Card */}
              <Card hoverEffect className="p-6 border-accent-100 bg-gradient-to-br from-white to-accent-50/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-accent-800">{data.todayGuide.badgeText}</span>
                  </div>
                  <Badge variant="accent">원 액션</Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{data.todayGuide.actionText}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  작은 습관 변화와 기록 지속이 장기적인 피부 진정 효과를 유의미하게 향상시킵니다.
                </p>

                <div className="pt-2 flex items-center gap-2">
                  <Button size="sm" onClick={() => setIsRecordModalOpen(true)} className="bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>실행 후 기록 완료</span>
                  </Button>
                </div>
              </Card>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/analysis/new">
                <Card hoverEffect className="p-4 flex items-center gap-3 bg-white border-slate-200">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">피부 분석</h4>
                    <p className="text-[10px] text-slate-500">AI 사진 분석</p>
                  </div>
                </Card>
              </Link>

              <button onClick={() => setIsRecordModalOpen(true)} className="text-left">
                <Card hoverEffect className="p-4 flex items-center gap-3 bg-white border-slate-200">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">피부 기록</h4>
                    <p className="text-[10px] text-slate-500">일일 수치 입력</p>
                  </div>
                </Card>
              </button>

              <Link href="/hospitals">
                <Card hoverEffect className="p-4 flex items-center gap-3 bg-white border-slate-200">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">병원 찾기</h4>
                    <p className="text-[10px] text-slate-500">주변 피부과 탐색</p>
                  </div>
                </Card>
              </Link>

              <Link href="/history">
                <Card hoverEffect className="p-4 flex items-center gap-3 bg-white border-slate-200">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">치료 기록</h4>
                    <p className="text-[10px] text-slate-500">이력 타임라인</p>
                  </div>
                </Card>
              </Link>
            </div>

            {/* Section 3: Recent Skin Trend Chart */}
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recent Skin Trend (최근 14일 변화)</h3>
                  <p className="text-xs text-slate-500">피부 종합 점수와 주요 고민 지수의 추이를 모니터링합니다.</p>
                </div>
                <Badge variant="neutral">Recharts 기반 시각화</Badge>
              </div>

              <SkinTrendChart data={data.recentSkinTrend} />
            </Card>

            {/* Section 4: My Skin Journey Preview & Recommended Hospitals */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Timeline Preview */}
              <Card className="lg:col-span-6 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">My Skin Journey</h3>
                  <Link href="/history">
                    <Button size="sm" variant="ghost" className="text-xs font-bold text-brand-600 gap-1 p-0">
                      <span>전체 기록 보기</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="space-y-3">
                  {data.skinJourneyPreview.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-md">
                          {item.date}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.title}</p>
                          <p className="text-[11px] text-slate-500">{item.concern}</p>
                        </div>
                      </div>
                      <Badge variant="neutral">{item.category}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommended Hospitals */}
              <Card className="lg:col-span-6 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">추천 주변 피부과</h3>
                  <Link href="/hospitals">
                    <Button size="sm" variant="ghost" className="text-xs font-bold text-brand-600 gap-1 p-0">
                      <span>모두 보기</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="space-y-3">
                  {data.recommendedHospitals.map((hosp) => (
                    <div key={hosp.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{hosp.name}</span>
                          {hosp.isSpecialist && <Badge variant="brand">전문의</Badge>}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          ⭐ {hosp.rating} ({hosp.reviewCount}) • 거리 {hosp.distance}
                        </p>
                      </div>
                      <Link href={`/hospitals/${hosp.id}`}>
                        <Button size="sm" variant="outline" className="text-xs px-2.5 py-1">
                          상세
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Medical Safety Disclaimer */}
            <MedicalDisclaimer />
          </>
        )}
      </div>

      {/* Quick Skin Record Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="오늘의 피부 상태 간단 기록"
      >
        <form onSubmit={handleQuickRecordSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              오늘 피부 종합 컨디션 점수 ({recordScore}점)
            </label>
            <input
              type="range"
              min="30"
              max="100"
              value={recordScore}
              onChange={(e) => setRecordScore(parseInt(e.target.value, 10))}
              className="w-full accent-brand-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>30점 (심한 트러블/자극)</span>
              <span>70점 (보통)</span>
              <span>100점 (매우 양호)</span>
            </div>
          </div>

          <Textarea
            label="특이사항 및 메모 (선택)"
            placeholder="예: 어제 수면시간이 적어서 아침에 유분이 약간 올라옴."
            value={recordNotes}
            onChange={(e) => setRecordNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsRecordModalOpen(false)}>
              취소
            </Button>
            <Button type="submit" isLoading={isSubmittingRecord} className="bg-brand-600 text-white font-bold">
              기록 저장하기
            </Button>
          </div>
        </form>
      </Modal>
    </MainShell>
  );
}
