'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CalendarRange, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/states/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { EmptyState } from '@/components/states/EmptyState';
import { RecoveryCurveChart } from '@/features/recovery/RecoveryCurveChart';
import { AlertCard } from '@/features/recovery/AlertCard';
import { RecoveryScreenData, SymptomKey } from '@/types';
import { journeyService } from '@/services/journey';
import { cn } from '@/lib/utils';

const statusCopy = {
  'on-track': { label: '예상 범위 안', variant: 'success' as const },
  watch: { label: '지켜보는 중', variant: 'warning' as const },
  'off-track': { label: '확인 필요', variant: 'danger' as const },
  completed: { label: '여정 완료', variant: 'neutral' as const },
};

export default function RecoveryPage() {
  const [data, setData] = useState<RecoveryScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selected, setSelected] = useState<SymptomKey>('swelling');
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareError, setShareError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      setData(await journeyService.getRecovery());
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleShare = async (alertId: string) => {
    setSharingId(alertId);
    setShareError('');
    try {
      await journeyService.shareAlertWithClinic(alertId);
      await load();
    } catch (err) {
      // 동의가 꺼져 있으면 서버(또는 DB 트리거)가 거절한다. 조용히 실패하지 않는다.
      setShareError(
        err instanceof Error ? err.message : '공유하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setSharingId(null);
    }
  };

  const series = data?.series.find((s) => s.symptom === selected);

  return (
    <MainShell title="회복 곡선" subtitle="예상 회복과 내 기록을 겹쳐서 봅니다">
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-72" />
          <Skeleton className="h-40" />
        </div>
      )}
      {!isLoading && isError && <ErrorState onRetry={load} />}

      {!isLoading && !isError && data && (
        <div className="space-y-4">
          {/* 요약 */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 truncate">
                  {data.journey.procedureName}
                </h2>
                <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <CalendarRange className="w-3.5 h-3.5" />
                  {data.journey.procedureDate} 시술 · D+{data.journey.currentDay} / D+
                  {data.protocol.totalRecoveryDays - 1}
                </p>
              </div>
              <Badge variant={statusCopy[data.journey.status].variant}>
                {statusCopy[data.journey.status].label}
              </Badge>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs text-slate-500">증상 회복 진행률</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {data.journey.recoveryProgress}%
                </span>
              </div>
              <Progress value={data.journey.recoveryProgress} />
              <p className="text-[11px] text-slate-500 mt-2">
                경과일이 아니라 실제 증상 기록이 얼마나 줄었는지로 계산합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-[11px] text-slate-500">결과가 보이기 시작하는 시점</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  D+{data.protocol.resultVisibleFromDay}
                  <span className="text-xs font-medium text-slate-400 ml-1">
                    ({data.protocol.resultVisibleFromDay - data.journey.currentDay}일 남음)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">기록한 날</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {data.checkins.length}일 / {data.journey.currentDay + 1}일
                </p>
              </div>
            </div>
          </Card>

          {/* 증상 선택 + 곡선 */}
          <Card>
            <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
              {data.series.map((s) => {
                const active = s.symptom === selected;
                return (
                  <button
                    key={s.symptom}
                    type="button"
                    onClick={() => setSelected(s.symptom)}
                    aria-pressed={active}
                    className={cn(
                      'shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors min-h-[40px]',
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200'
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {series && (
              <>
                <div className="flex items-center gap-2 mt-3 mb-1">
                  {series.recentDeviation < -0.3 ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                      <p className="text-xs text-emerald-700 font-semibold">
                        최근 7일 기준 예상보다 빠르게 회복 중
                      </p>
                    </>
                  ) : series.recentDeviation > 0.3 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      <p className="text-xs text-amber-700 font-semibold">
                        최근 7일 기준 예상보다 천천히 회복 중
                      </p>
                    </>
                  ) : (
                    <>
                      <Minus className="w-4 h-4 text-slate-400" />
                      <p className="text-xs text-slate-600 font-semibold">
                        최근 7일 기준 예상 범위와 거의 같음
                      </p>
                    </>
                  )}
                </div>

                <RecoveryCurveChart series={series} />

                <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 border-t-2 border-dashed border-slate-400" />
                    같은 시술 예상 곡선
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 border-t-2 border-brand-600" />내 기록
                  </span>
                </div>
              </>
            )}
          </Card>

          {/* 단계별 프로토콜 — 종이 리포트를 대체하는 부분 */}
          <Card>
            <h3 className="text-sm font-bold text-slate-900 mb-3">회복 단계별 안내</h3>
            <ol className="space-y-3">
              {data.protocol.phases.map((phase) => {
                const passed = data.journey.currentDay > phase.endDay;
                const active =
                  data.journey.currentDay >= phase.startDay &&
                  data.journey.currentDay <= phase.endDay;
                return (
                  <li
                    key={phase.key}
                    className={cn(
                      'relative pl-6 pb-3 border-l-2 last:pb-0',
                      passed ? 'border-brand-500' : active ? 'border-brand-300' : 'border-slate-200'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-white',
                        passed ? 'bg-brand-500' : active ? 'bg-brand-400' : 'bg-slate-300'
                      )}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={cn(
                          'text-sm font-bold',
                          active ? 'text-brand-700' : 'text-slate-800'
                        )}
                      >
                        {phase.label}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        D+{phase.startDay} ~ D+{phase.endDay}
                      </span>
                      {active && <Badge variant="brand">현재</Badge>}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">{phase.summary}</p>
                    <p className="text-xs text-amber-700 leading-relaxed mt-1">
                      주의: {phase.keyRisk}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Card>

          {/* 알림 이력 */}
          <section id="alerts" className="space-y-3 scroll-mt-20">
            <h3 className="text-sm font-bold text-slate-900">확인이 필요했던 순간</h3>
            {shareError && (
              <p
                role="alert"
                className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
              >
                {shareError}
              </p>
            )}
            {data.alerts.length === 0 ? (
              <EmptyState
                title="아직 벗어난 기록이 없어요"
                message="회복이 예상 곡선 안에서 진행되고 있습니다."
              />
            ) : (
              data.alerts.map((a) => (
                <AlertCard
                  key={a.id}
                  alert={a}
                  onShare={handleShare}
                  isSharing={sharingId === a.id}
                />
              ))
            )}
          </section>

          <MedicalDisclaimer />
        </div>
      )}
    </MainShell>
  );
}
