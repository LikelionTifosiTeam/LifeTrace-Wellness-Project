'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronRight,
  Flag,
  Flame,
  Moon,
  PencilLine,
  Sun,
  Timer,
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/states/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { PhaseProgress } from '@/features/today/PhaseProgress';
import { CareCardView } from '@/features/today/CareCardView';
import { AlertCard } from '@/features/recovery/AlertCard';
import { TodayScreenData } from '@/types';
import { journeyService } from '@/services/journey';
import { getJustLiftedRestrictions } from '@/lib/recovery';
import { formatKoreanDate } from '@/lib/utils';

function TodaySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-16" />
      <Skeleton className="h-64" />
      <Skeleton className="h-24" />
    </div>
  );
}

export default function TodayPage() {
  const [data, setData] = useState<TodayScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      setData(await journeyService.getToday());
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lifted = data ? getJustLiftedRestrictions(data.protocol, data.journey.currentDay) : [];

  return (
    <MainShell
      title={data ? `D+${data.journey.currentDay} · ${data.currentPhase.label}` : '오늘'}
      subtitle={data ? formatKoreanDate(data.careCard.date) : undefined}
      hasAlert={Boolean(data?.activeAlert)}
    >
      {isLoading && <TodaySkeleton />}
      {!isLoading && isError && <ErrorState onRetry={load} />}

      {!isLoading && !isError && data && (
        <div className="space-y-4">
          <Card>
            <PhaseProgress
              protocol={data.protocol}
              journey={data.journey}
              currentPhase={data.currentPhase}
            />
          </Card>

          {/* 오늘 막 풀린 금기 — 사용자가 가장 기다리는 정보 */}
          {lifted.length > 0 && (
            <Card className="bg-emerald-50/70 border-emerald-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">오늘부터 다시 괜찮아요</h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    {lifted.map((r) => r.label).join(', ')}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* 여정을 마친 뒤에는 체크인을 더 받지 않는다 */}
          {data.journey.status === 'completed' ? (
            <Card className="bg-slate-900 border-slate-900 text-white">
              <div className="flex items-start gap-3">
                <Flag className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">이 회복 여정을 마쳤어요</p>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    기록은 그대로 보관됩니다. 다음 시술을 받으면 새 여정을 시작해 주세요.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <Link href="/journal" className="flex-1">
                      <Button size="sm" variant="secondary" className="w-full">
                        기록 보기
                      </Button>
                    </Link>
                    <Link href="/onboarding" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        새 시술 등록
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ) : data.todayCheckin ? (
            <Card className="bg-brand-50/60 border-brand-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">오늘 체크인 완료</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {data.todayCheckin.durationSeconds}초 만에 기록했어요 · {data.streak.current}일
                    연속
                  </p>
                </div>
                <Link href="/checkin">
                  <Button size="sm" variant="outline" className="bg-white">
                    수정
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Link href="/checkin" className="block">
              <Card hoverEffect className="bg-slate-900 border-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <PencilLine className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold flex items-center gap-2">
                      오늘 컨디션 기록하기
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/70">
                        <Timer className="w-3 h-3" />약 30초
                      </span>
                    </p>
                    <p className="text-xs text-white/70 mt-0.5">
                      사진 없이 5가지만 탭하면 끝 · {data.streak.current}일 연속 기록 중
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
                </div>
              </Card>
            </Link>
          )}

          {data.activeAlert && <AlertCard alert={data.activeAlert} />}

          <CareCardView card={data.careCard} />

          {/* 오늘의 생활 신호 요약 */}
          <Card>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
              오늘의 컨디션 신호
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Moon className="w-4 h-4 text-accent-600 mx-auto mb-1.5" />
                <p className="text-lg font-extrabold text-slate-900 leading-none">
                  {data.vitals ? data.vitals.sleepHours.toFixed(1) : '—'}
                  <span className="text-xs font-medium text-slate-400 ml-0.5">h</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">어젯밤 수면</p>
              </div>
              <div className="text-center">
                <Flame className="w-4 h-4 text-brand-600 mx-auto mb-1.5" />
                <p className="text-lg font-extrabold text-slate-900 leading-none">
                  {data.vitals ? data.vitals.stressLevel : '—'}
                  <span className="text-xs font-medium text-slate-400 ml-0.5">/10</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">스트레스</p>
              </div>
              <div className="text-center">
                <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1.5" />
                <p className="text-lg font-extrabold text-slate-900 leading-none">
                  {data.environment.uvIndex}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">자외선 지수</p>
              </div>
            </div>
            <Link
              href="/vitals"
              className="flex items-center justify-center gap-1 mt-4 text-xs font-semibold text-brand-700"
            >
              생활 신호와 회복 속도의 관계 보기
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* 클리닉 노트 — 종이 대신 앱에 살아 있는 리포트 */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">시술 리포트</Badge>
              <span className="text-xs text-slate-500">
                {data.journey.clinicName} · {data.journey.practitionerName}
              </span>
            </div>
            <p className="text-[13px] text-slate-700 leading-relaxed">
              {data.protocol.clinicNote}
            </p>
            <Link
              href="/recovery"
              className="flex items-center gap-1 mt-3 text-xs font-semibold text-brand-700"
            >
              전체 회복 곡선과 프로토콜 보기
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          <MedicalDisclaimer />
        </div>
      )}
    </MainShell>
  );
}
