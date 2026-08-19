'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Link2, Moon, PencilLine, Wind } from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/states/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { EmptyState } from '@/components/states/EmptyState';
import { VitalsChart } from '@/features/vitals/VitalsChart';
import { DailyCheckin, SymptomKey, VitalsScreenData } from '@/types';
import { vitalsService } from '@/services/vitals';
import { todayKST } from '@/lib/utils';
import { checkinService } from '@/services/checkin';
import { SYMPTOM_LABELS, computeRecoveryModifier } from '@/lib/recovery';
import { cn } from '@/lib/utils';

const sourceLabel: Record<string, string> = {
  'apple-health': 'Apple 건강',
  'galaxy-watch': 'Galaxy Watch',
  fitbit: 'Fitbit',
  manual: '직접 입력',
};

export default function VitalsPage() {
  const [data, setData] = useState<VitalsScreenData | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [symptom, setSymptom] = useState<SymptomKey>('swelling');
  const [showManual, setShowManual] = useState(false);
  const [manualSleep, setManualSleep] = useState('7.0');
  const [manualHrv, setManualHrv] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  const handleManualSave = async () => {
    setIsSavingManual(true);
    try {
      await vitalsService.saveManualVitals({
        date: todayKST(),
        sleepHours: Number(manualSleep) || 0,
        hrvMs: manualHrv ? Number(manualHrv) : undefined,
      });
      setShowManual(false);
      await load();
    } finally {
      setIsSavingManual(false);
    }
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [v, c] = await Promise.all([
        vitalsService.getVitals(),
        checkinService.getCheckins(),
      ]);
      setData(v);
      setCheckins(c);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await vitalsService.connectWearable('apple-health');
      await load();
    } finally {
      setIsConnecting(false);
    }
  };

  const modifier = data ? computeRecoveryModifier(data.wearables) : null;
  const latest = data?.wearables[data.wearables.length - 1];

  return (
    <MainShell title="컨디션" subtitle="생활 신호가 회복 속도에 미치는 영향">
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
      )}
      {!isLoading && isError && <ErrorState onRetry={load} />}

      {!isLoading && !isError && data && (
        <div className="space-y-4">
          {!data.connected ? (
            <>
              <EmptyState
                icon={Link2}
                title="웨어러블을 연결하면 회복 예측이 더 정확해집니다"
                message="수면과 심박변이도(HRV)를 함께 보면 오늘의 회복 속도를 개인에 맞게 다시 계산할 수 있습니다."
                actionText="Apple 건강 연결하기"
                onAction={handleConnect}
              />
              <Card>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
                  <PencilLine className="w-4 h-4 text-slate-400" />
                  웨어러블이 없어도 괜찮아요
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  어젯밤 잔 시간만 직접 입력해도 회복 속도 기대치가 보정됩니다. 기기가 없다는
                  이유로 개인화를 포기하지 않아도 됩니다.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setShowManual(true)}>
                  수면 직접 입력하기
                </Button>
              </Card>
            </>
          ) : (
            <>
              {/* 회복 속도 보정 — 이 서비스가 웨어러블을 쓰는 이유 */}
              <Card className="bg-slate-900 border-slate-900 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" />
                  <p className="text-xs font-semibold text-white/80">
                    회복 속도 보정 · {sourceLabel[data.source ?? 'manual']} 연동됨
                  </p>
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

              {/* 오늘 수치 */}
              {latest && (
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-4 text-center">
                    <Moon className="w-4 h-4 text-accent-600 mx-auto mb-1.5" />
                    <p className="text-lg font-extrabold text-slate-900 leading-none">
                      {latest.sleepHours.toFixed(1)}
                      <span className="text-xs font-medium text-slate-400">h</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">수면</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Activity className="w-4 h-4 text-brand-600 mx-auto mb-1.5" />
                    <p className="text-lg font-extrabold text-slate-900 leading-none">
                      {latest.hrvMs}
                      <span className="text-xs font-medium text-slate-400">ms</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">HRV</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Wind className="w-4 h-4 text-slate-500 mx-auto mb-1.5" />
                    <p className="text-lg font-extrabold text-slate-900 leading-none">
                      {latest.restingHr}
                      <span className="text-xs font-medium text-slate-400">bpm</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">안정시 심박</p>
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
                        'shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                        symptom === k
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200'
                      )}
                    >
                      {SYMPTOM_LABELS[k]}
                    </button>
                  ))}
                </div>
                <VitalsChart
                  wearables={data.wearables}
                  checkins={checkins}
                  symptom={symptom}
                  symptomLabel={SYMPTOM_LABELS[symptom]}
                />
              </Card>

              {/* 상관 */}
              <Card>
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  내 기록에서 발견된 관계
                </h3>
                <ul className="space-y-3">
                  {data.correlations.map((c) => {
                    const strength = Math.abs(c.coefficient);
                    return (
                      <li key={c.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <p className="text-sm font-semibold text-slate-800">
                            {c.signalLabel} ↔ {c.symptomLabel}
                          </p>
                          <Badge
                            variant={strength >= 0.6 ? 'brand' : strength >= 0.4 ? 'accent' : 'neutral'}
                          >
                            r = {c.coefficient}
                          </Badge>
                          <span className="text-[11px] text-slate-400">{c.sampleDays}일 기준</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {c.plainExplanation}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">{c.disclaimer}</p>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  isLoading={isConnecting}
                  onClick={handleConnect}
                >
                  연동 데이터 새로고침
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowManual(true)}>
                  <PencilLine className="w-4 h-4" />
                  오늘 수면 직접 입력
                </Button>
              </div>
            </>
          )}

          <MedicalDisclaimer />
        </div>
      )}

      <Modal isOpen={showManual} onClose={() => setShowManual(false)} title="오늘 컨디션 직접 입력">
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          웨어러블 연동 없이도 수면 시간만 있으면 회복 속도 기대치를 보정할 수 있습니다. HRV는
          아는 경우에만 입력하세요.
        </p>
        <div className="space-y-4">
          <Input
            label="어젯밤 수면 시간"
            type="number"
            step="0.5"
            min="0"
            max="14"
            value={manualSleep}
            onChange={(e) => setManualSleep(e.target.value)}
          />
          <Input
            label="HRV (ms, 선택)"
            type="number"
            min="0"
            max="200"
            placeholder="모르면 비워두세요"
            value={manualHrv}
            onChange={(e) => setManualHrv(e.target.value)}
          />
        </div>
        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => setShowManual(false)}>
            취소
          </Button>
          <Button className="flex-1" isLoading={isSavingManual} onClick={handleManualSave}>
            저장
          </Button>
        </div>
      </Modal>
    </MainShell>
  );
}
