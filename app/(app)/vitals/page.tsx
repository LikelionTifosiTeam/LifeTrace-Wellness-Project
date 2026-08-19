'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Moon, PencilLine, Wine } from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/states/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { EmptyState } from '@/components/states/EmptyState';
import { VitalsChart } from '@/features/vitals/VitalsChart';
import { DailyCheckin, SymptomKey, VitalsScreenData } from '@/types';
import { vitalsService } from '@/services/vitals';
import { checkinService } from '@/services/checkin';
import { journeyService } from '@/services/journey';
import { SYMPTOM_LABELS, computeRecoveryModifier } from '@/lib/recovery';
import { cn, todayKST } from '@/lib/utils';

export default function VitalsPage() {
  const [data, setData] = useState<VitalsScreenData | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [procedureDate, setProcedureDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [symptom, setSymptom] = useState<SymptomKey>('swelling');

  const [showForm, setShowForm] = useState(false);
  const [sleep, setSleep] = useState('7.0');
  const [stress, setStress] = useState(4);
  const [alcohol, setAlcohol] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [v, c, t] = await Promise.all([
        vitalsService.getVitals(),
        checkinService.getCheckins(),
        journeyService.getToday(),
      ]);
      setData(v);
      setCheckins(c);
      setProcedureDate(t.journey.procedureDate);
      const today = v.vitals.find((x) => x.date === todayKST());
      if (today) {
        setSleep(String(today.sleepHours));
        setStress(today.stressLevel);
        setAlcohol(today.alcohol);
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await vitalsService.saveVitals({
        date: todayKST(),
        sleepHours: Number(sleep) || 0,
        stressLevel: stress,
        alcohol,
      });
      setShowForm(false);
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  const modifier = data ? computeRecoveryModifier(data.vitals) : null;
  const latest = data?.vitals[data.vitals.length - 1];

  return (
    <MainShell title="컨디션" subtitle="생활 신호가 회복 속도에 미치는 영향">
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
      )}
      {!isLoading && isError && <ErrorState onRetry={load} />}

      {!isLoading && !isError && data && (
        <div className="space-y-4">
          {data.vitals.length === 0 ? (
            <EmptyState
              icon={PencilLine}
              title="오늘 컨디션을 기록해 주세요"
              message="수면 시간과 스트레스만 입력하면 회복 속도 기대치가 나에게 맞게 조정됩니다. 별도 기기나 앱 연동이 필요 없습니다."
              actionText="컨디션 입력하기"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <>
              {/* 회복 속도 보정 — 컨디션을 기록하는 이유 */}
              <Card className="bg-slate-900 border-slate-900 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" />
                  <p className="text-xs font-semibold text-white/80">회복 속도 보정</p>
                </div>
                <p className="text-3xl font-black tracking-tighter">
                  {Math.round((modifier?.factor ?? 1) * 100)}%
                  <span className="text-sm font-medium text-white/60 ml-2">표준 대비</span>
                </p>
                <ul className="mt-3 space-y-1">
                  {modifier?.reasons.map((r) => (
                    <li key={r} className="text-xs text-white/75 leading-relaxed">
                      · {r}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-white/50 mt-3 leading-relaxed">
                  이 보정값은 회복 곡선의 기대치를 조정하는 데 쓰입니다. 의학적 확정 수치가 아니라
                  서비스 내부 가중치입니다.
                </p>
              </Card>

              {/* 오늘 기록 상태 */}
              <Card className={cn(!data.hasToday && 'border-dashed border-slate-300')}>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {data.hasToday ? '오늘 컨디션 기록 완료' : '오늘 컨디션이 아직 비어 있어요'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {data.hasToday
                        ? '수정하려면 다시 입력하면 됩니다.'
                        : '수면 시간만 입력해도 보정이 시작됩니다.'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                    {data.hasToday ? '수정' : '입력'}
                  </Button>
                </div>
              </Card>

              {latest && (
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-4 text-center">
                    <Moon className="w-4 h-4 text-accent-600 mx-auto mb-1.5" />
                    <p className="text-lg font-extrabold text-slate-900 leading-none">
                      {latest.sleepHours.toFixed(1)}
                      <span className="text-xs font-medium text-slate-400">h</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">최근 수면</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Activity className="w-4 h-4 text-brand-600 mx-auto mb-1.5" />
                    <p className="text-lg font-extrabold text-slate-900 leading-none">
                      {latest.stressLevel}
                      <span className="text-xs font-medium text-slate-400">/10</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">스트레스</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Wine className="w-4 h-4 text-slate-500 mx-auto mb-1.5" />
                    <p className="text-lg font-extrabold text-slate-900 leading-none">
                      {data.vitals.filter((v) => v.alcohol).length}
                      <span className="text-xs font-medium text-slate-400">일</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">음주한 날</p>
                  </Card>
                </div>
              )}

              {/* 수면 × 증상 */}
              <Card>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  수면과 {SYMPTOM_LABELS[symptom]}
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  막대는 그날의 수면 시간, 선은 그날 기록한 {SYMPTOM_LABELS[symptom]} 정도입니다.
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-2">
                  {(Object.keys(SYMPTOM_LABELS) as SymptomKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSymptom(k)}
                      aria-pressed={symptom === k}
                      className={cn(
                        'shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors min-h-[36px]',
                        symptom === k
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200'
                      )}
                    >
                      {SYMPTOM_LABELS[k]}
                    </button>
                  ))}
                </div>
                {procedureDate && (
                  <VitalsChart
                    vitals={data.vitals}
                    checkins={checkins}
                    procedureDate={procedureDate}
                    symptom={symptom}
                    symptomLabel={SYMPTOM_LABELS[symptom]}
                  />
                )}
              </Card>

              {/* 상관 */}
              <Card>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  내 기록에서 발견된 관계
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  아래 숫자는 회원님의 실제 기록으로 매번 다시 계산됩니다.
                </p>
                <ul className="space-y-3">
                  {data.correlations.map((c) => {
                    const strength = Math.abs(c.coefficient);
                    const enough = c.sampleDays >= 7;
                    return (
                      <li
                        key={c.id}
                        className="pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <p className="text-sm font-semibold text-slate-800">
                            {c.signalLabel} ↔ {c.symptomLabel}
                          </p>
                          <Badge
                            variant={
                              !enough ? 'neutral' : strength >= 0.6 ? 'brand' : strength >= 0.4 ? 'accent' : 'neutral'
                            }
                          >
                            r = {c.coefficient}
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            {c.sampleDays}일 기준
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {c.plainExplanation}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {enough
                            ? c.disclaimer
                            : `표본이 ${c.sampleDays}일뿐이라 아직 신뢰하기 이릅니다. 7일 이상 쌓이면 의미가 생깁니다.`}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </>
          )}

          <MedicalDisclaimer />
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="오늘 컨디션">
        <p className="text-xs text-slate-500 leading-relaxed mb-5">
          웨어러블이나 별도 앱 없이 이 세 가지만 있으면 회복 속도 기대치를 조정할 수 있습니다.
        </p>

        <div className="space-y-5">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="sleep" className="text-xs font-semibold text-slate-700">
                어젯밤 수면 시간
              </label>
              <span className="text-sm font-bold text-slate-900">{sleep}시간</span>
            </div>
            <input
              id="sleep"
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">오늘 스트레스</span>
              <span className="text-sm font-bold text-slate-900">{stress}/10</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 11 }).map((_, n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStress(n)}
                  aria-label={`스트레스 ${n}점`}
                  aria-pressed={stress === n}
                  className={cn(
                    'flex-1 h-9 rounded-lg text-[11px] font-bold border transition-colors',
                    stress === n
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-400 border-slate-200'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAlcohol((v) => !v)}
            aria-pressed={alcohol}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all min-h-[56px]',
              alcohol ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'
            )}
          >
            <Wine className={cn('w-4 h-4 shrink-0', alcohol ? 'text-amber-600' : 'text-slate-400')} />
            <span className="text-sm text-slate-700 flex-1">어제 술을 마셨어요</span>
            <span
              className={cn(
                'text-xs font-bold',
                alcohol ? 'text-amber-700' : 'text-slate-400'
              )}
            >
              {alcohol ? '예' : '아니오'}
            </span>
          </button>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
            취소
          </Button>
          <Button className="flex-1" isLoading={isSaving} onClick={handleSave}>
            저장
          </Button>
        </div>
      </Modal>
    </MainShell>
  );
}
